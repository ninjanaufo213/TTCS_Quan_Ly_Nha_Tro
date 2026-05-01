package com.example.demo.service;

import com.example.demo.dto.InvoiceRequest;
import com.example.demo.dto.InvoiceResponse;
import com.example.demo.model.Invoice;
import com.example.demo.model.InvoiceItem;
import com.example.demo.model.RentedRoom;
import com.example.demo.model.Room;
import com.example.demo.model.Tenant;
import com.example.demo.repository.InvoiceItemRepository;
import com.example.demo.repository.InvoiceRepository;
import com.example.demo.repository.RentedRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private static final String ITEM_RENT = "RENT";
    private static final String ITEM_WATER = "WATER";
    private static final String ITEM_INTERNET = "INTERNET";
    private static final String ITEM_GENERAL = "GENERAL";
    private static final String ITEM_ELECTRICITY = "ELECTRICITY";
    private static final String PROOF_NONE = "NONE";
    private static final String PROOF_PENDING = "PENDING";
    private static final String PROOF_APPROVED = "APPROVED";
    private static final String PROOF_REJECTED = "REJECTED";

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final RentedRoomRepository rentedRoomRepository;
    private final AuthService authService;

    public List<InvoiceResponse> getAllInvoices(String month, Integer houseId, Integer roomId, Boolean isPaid) {
        Integer landlordId = authService.getCurrentLandlordId();
        YearMonth yearMonth = parseMonth(month);

        return invoiceRepository
                .findByRentedRoom_Room_House_Landlord_LandlordIdOrderByDueDateDescCreatedAtDesc(landlordId)
                .stream()
                .filter(invoice -> matchesFilter(invoice, yearMonth, houseId, roomId, isPaid))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InvoiceResponse> getInvoicesByRentedRoom(Integer rrId) {
        RentedRoom rentedRoom = getRentedRoomAndCheckOwnership(rrId);
        return invoiceRepository.findByRentedRoom_RrIdOrderByDueDateDescCreatedAtDesc(rentedRoom.getRrId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InvoiceResponse> getPendingInvoices() {
        Integer landlordId = authService.getCurrentLandlordId();
        return invoiceRepository
                .findByRentedRoom_Room_House_Landlord_LandlordIdAndIsPaidFalseOrderByDueDateAsc(landlordId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public InvoiceResponse getInvoiceById(Integer invoiceId) {
        Invoice invoice = getInvoiceAndCheckOwnership(invoiceId);
        return toResponse(invoice);
    }

    public List<InvoiceResponse> getMyInvoices() {
        Integer tenantId = authService.getCurrentTenantId();
        return invoiceRepository.findByRentedRoom_Tenant_TenantIdOrderByDueDateDescCreatedAtDesc(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public InvoiceResponse createInvoice(InvoiceRequest request) {
        if (request.getRrId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn hợp đồng!");
        }
        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày đến hạn!");
        }

        RentedRoom rentedRoom = getRentedRoomAndCheckOwnership(request.getRrId());
        ComponentAmounts amounts = resolveAmounts(request, null);

        Invoice invoice = Invoice.builder()
                .rentedRoom(rentedRoom)
                .dueDate(request.getDueDate().toLocalDate())
                .isPaid(request.getPaymentDate() != null || Boolean.TRUE.equals(request.getIsPaid()))
                .paymentDate(request.getPaymentDate())
                .totalAmount(amounts.totalAmount())
                .proofStatus(PROOF_NONE)
                .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);
        recreateItems(savedInvoice, amounts);

        return toResponse(savedInvoice);
    }

    public InvoiceResponse updateInvoice(Integer invoiceId, InvoiceRequest request) {
        Invoice invoice = getInvoiceAndCheckOwnership(invoiceId);
        ComponentAmounts current = extractComponentAmounts(invoice);
        ComponentAmounts amounts = resolveAmounts(request, current);

        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate().toLocalDate());
        }

        if (request.getPaymentDate() != null) {
            invoice.setPaymentDate(request.getPaymentDate());
            invoice.setIsPaid(true);
        } else if (request.getIsPaid() != null) {
            invoice.setIsPaid(request.getIsPaid());
            if (!request.getIsPaid()) {
                invoice.setPaymentDate(null);
            }
        }

        invoice.setTotalAmount(amounts.totalAmount());
        Invoice savedInvoice = invoiceRepository.save(invoice);
        recreateItems(savedInvoice, amounts);

        return toResponse(savedInvoice);
    }

    public InvoiceResponse payInvoice(Integer invoiceId) {
        Invoice invoice = getInvoiceAndCheckOwnership(invoiceId);
        invoice.setIsPaid(true);
        invoice.setPaymentDate(LocalDateTime.now());
        invoice.setProofStatus(PROOF_APPROVED);
        Invoice savedInvoice = invoiceRepository.save(invoice);
        return toResponse(savedInvoice);
    }

    public InvoiceResponse submitPaymentProof(Integer invoiceId, String proofUrl, String note) {
        Invoice invoice = getInvoiceAndCheckTenantOwnership(invoiceId);
        if (PROOF_APPROVED.equalsIgnoreCase(invoice.getProofStatus())) {
            throw new IllegalArgumentException("Hóa đơn đã được duyệt thanh toán.");
        }
        invoice.setProofUrl(proofUrl);
        invoice.setProofNote(note);
        invoice.setProofStatus(PROOF_PENDING);
        invoice.setProofSubmittedAt(LocalDateTime.now());
        invoice.setIsPaid(false);
        invoice.setPaymentDate(null);
        return toResponse(invoiceRepository.save(invoice));
    }

    public InvoiceResponse approvePaymentProof(Integer invoiceId, String reviewNote) {
        Invoice invoice = getInvoiceAndCheckOwnership(invoiceId);
        if (invoice.getProofUrl() == null || invoice.getProofUrl().isBlank()) {
            throw new IllegalArgumentException("Hóa đơn chưa có minh chứng thanh toán.");
        }
        invoice.setProofStatus(PROOF_APPROVED);
        invoice.setProofReviewNote(reviewNote);
        invoice.setProofReviewedAt(LocalDateTime.now());
        invoice.setIsPaid(true);
        invoice.setPaymentDate(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    public InvoiceResponse rejectPaymentProof(Integer invoiceId, String reviewNote) {
        Invoice invoice = getInvoiceAndCheckOwnership(invoiceId);
        if (invoice.getProofUrl() == null || invoice.getProofUrl().isBlank()) {
            throw new IllegalArgumentException("Hóa đơn chưa có minh chứng thanh toán.");
        }
        invoice.setProofStatus(PROOF_REJECTED);
        invoice.setProofReviewNote(reviewNote);
        invoice.setProofReviewedAt(LocalDateTime.now());
        invoice.setIsPaid(false);
        invoice.setPaymentDate(null);
        return toResponse(invoiceRepository.save(invoice));
    }

    public void deleteInvoice(Integer invoiceId) {
        Invoice invoice = getInvoiceAndCheckOwnership(invoiceId);
        invoiceRepository.delete(invoice);
    }

    private boolean matchesFilter(Invoice invoice, YearMonth yearMonth, Integer houseId, Integer roomId, Boolean isPaid) {
        LocalDate dueDate = invoice.getDueDate();
        Integer invoiceHouseId = Optional.ofNullable(invoice.getRentedRoom())
                .map(RentedRoom::getRoom)
                .map(Room::getHouse)
                .map(house -> house.getHouseId())
                .orElse(null);
        Integer invoiceRoomId = Optional.ofNullable(invoice.getRentedRoom())
                .map(RentedRoom::getRoom)
                .map(Room::getRoomId)
                .orElse(null);

        if (yearMonth != null && (dueDate == null || !YearMonth.from(dueDate).equals(yearMonth))) {
            return false;
        }
        if (houseId != null && !houseId.equals(invoiceHouseId)) {
            return false;
        }
        if (roomId != null && !roomId.equals(invoiceRoomId)) {
            return false;
        }
        return isPaid == null || isPaid.equals(Boolean.TRUE.equals(invoice.getIsPaid()));
    }

    private ComponentAmounts resolveAmounts(InvoiceRequest request, ComponentAmounts fallback) {
        BigDecimal price = amountOrFallback(request.getPrice(), fallback != null ? fallback.price() : BigDecimal.ZERO);
        BigDecimal waterPrice = amountOrFallback(request.getWaterPrice(), fallback != null ? fallback.waterPrice() : BigDecimal.ZERO);
        BigDecimal internetPrice = amountOrFallback(request.getInternetPrice(), fallback != null ? fallback.internetPrice() : BigDecimal.ZERO);
        BigDecimal generalPrice = amountOrFallback(request.getGeneralPrice(), fallback != null ? fallback.generalPrice() : BigDecimal.ZERO);
        BigDecimal electricityPrice = amountOrFallback(request.getElectricityPrice(), fallback != null ? fallback.electricityPrice() : BigDecimal.ZERO);

        Integer electricityNum = quantityOrFallback(request.getElectricityNum(), fallback != null ? fallback.electricityNum() : 0);
        Integer waterNum = quantityOrFallback(request.getWaterNum(), fallback != null ? fallback.waterNum() : 0);

        BigDecimal total = price
                .add(waterPrice)
                .add(internetPrice)
                .add(generalPrice)
                .add(electricityPrice);

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Tổng hóa đơn phải lớn hơn 0!");
        }

        return new ComponentAmounts(price, waterPrice, internetPrice, generalPrice, electricityPrice, electricityNum, waterNum, total);
    }

    private BigDecimal amountOrFallback(BigDecimal amount, BigDecimal fallback) {
        BigDecimal value = amount != null ? amount : fallback;
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Chi phí không được âm!");
        }
        return value;
    }

    private Integer quantityOrFallback(Integer quantity, Integer fallback) {
        Integer value = quantity != null ? quantity : fallback;
        if (value < 0) {
            throw new IllegalArgumentException("Số lượng không được âm!");
        }
        return value;
    }

    private void recreateItems(Invoice invoice, ComponentAmounts amounts) {
        invoiceItemRepository.deleteByInvoice_InvoiceId(invoice.getInvoiceId());

        List<InvoiceItem> items = new ArrayList<>();
        appendItem(items, invoice, ITEM_RENT, amounts.price(), 1);
        appendItem(items, invoice, ITEM_WATER, amounts.waterPrice(), Math.max(1, amounts.waterNum()));
        appendItem(items, invoice, ITEM_INTERNET, amounts.internetPrice(), 1);
        appendItem(items, invoice, ITEM_GENERAL, amounts.generalPrice(), 1);
        appendItem(items, invoice, ITEM_ELECTRICITY, amounts.electricityPrice(), Math.max(1, amounts.electricityNum()));

        if (!items.isEmpty()) {
            invoiceItemRepository.saveAll(items);
        }
    }

    private void appendItem(List<InvoiceItem> items, Invoice invoice, String description, BigDecimal amount, Integer quantity) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal unitPrice = amount.divide(BigDecimal.valueOf(quantity), 0, RoundingMode.HALF_UP);
        items.add(InvoiceItem.builder()
                .invoice(invoice)
                .description(description)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .amount(amount)
                .build());
    }

    private ComponentAmounts extractComponentAmounts(Invoice invoice) {
        List<InvoiceItem> items = invoice.getInvoiceId() == null
                ? Collections.emptyList()
                : invoiceItemRepository.findByInvoice_InvoiceId(invoice.getInvoiceId());
        return extractComponentAmounts(items, invoice.getTotalAmount());
    }

    private ComponentAmounts extractComponentAmounts(List<InvoiceItem> items, BigDecimal fallbackTotalAmount) {
        Map<String, InvoiceItem> itemMap = items == null
                ? Collections.emptyMap()
                : items.stream().collect(Collectors.toMap(InvoiceItem::getDescription, item -> item, (a, b) -> b));

        BigDecimal price = amountOf(itemMap.get(ITEM_RENT));
        BigDecimal waterPrice = amountOf(itemMap.get(ITEM_WATER));
        BigDecimal internetPrice = amountOf(itemMap.get(ITEM_INTERNET));
        BigDecimal generalPrice = amountOf(itemMap.get(ITEM_GENERAL));
        BigDecimal electricityPrice = amountOf(itemMap.get(ITEM_ELECTRICITY));
        Integer electricityNum = quantityOf(itemMap.get(ITEM_ELECTRICITY));
        Integer waterNum = quantityOf(itemMap.get(ITEM_WATER));

        return new ComponentAmounts(
                price,
                waterPrice,
                internetPrice,
                generalPrice,
                electricityPrice,
                electricityNum,
                waterNum,
                fallbackTotalAmount != null ? fallbackTotalAmount : BigDecimal.ZERO
        );
    }

    private BigDecimal amountOf(InvoiceItem item) {
        return item == null || item.getAmount() == null ? BigDecimal.ZERO : item.getAmount();
    }

    private Integer quantityOf(InvoiceItem item) {
        return item == null || item.getQuantity() == null ? 0 : item.getQuantity();
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        ComponentAmounts amounts = extractComponentAmounts(invoice);

        RentedRoom rentedRoom = invoice.getRentedRoom();
        Tenant tenant = rentedRoom != null ? rentedRoom.getTenant() : null;
        Room room = rentedRoom != null ? rentedRoom.getRoom() : null;
        com.example.demo.model.House house = room != null ? room.getHouse() : null;
        com.example.demo.model.Landlord landlord = house != null ? house.getLandlord() : null;

        InvoiceResponse.InvoiceRoom invoiceRoom = room == null
                ? null
                : InvoiceResponse.InvoiceRoom.builder()
                .roomId(room.getRoomId())
                .houseId(room.getHouse() != null ? room.getHouse().getHouseId() : null)
                .name(room.getName())
                .build();

        InvoiceResponse.InvoiceRentedRoom invoiceRentedRoom = rentedRoom == null
                ? null
                : InvoiceResponse.InvoiceRentedRoom.builder()
                .rrId(rentedRoom.getRrId())
                .tenantId(tenant != null ? tenant.getTenantId() : null)
                .tenantName(tenant != null ? tenant.getFullname() : null)
                .tenantPhone(tenant != null && tenant.getUser() != null ? tenant.getUser().getPhone() : null)
                .room(invoiceRoom)
                .build();

        return InvoiceResponse.builder()
                .invoiceId(invoice.getInvoiceId())
                .rrId(rentedRoom != null ? rentedRoom.getRrId() : null)
                .rentedRoom(invoiceRentedRoom)
                .price(amounts.price())
                .waterPrice(amounts.waterPrice())
                .internetPrice(amounts.internetPrice())
                .generalPrice(amounts.generalPrice())
                .electricityPrice(amounts.electricityPrice())
                .electricityNum(amounts.electricityNum())
                .waterNum(amounts.waterNum())
                .totalAmount(invoice.getTotalAmount())
                .isPaid(Boolean.TRUE.equals(invoice.getIsPaid()))
                .paymentDate(invoice.getPaymentDate())
                .proofStatus(Optional.ofNullable(invoice.getProofStatus()).orElse(PROOF_NONE))
                .proofUrl(invoice.getProofUrl())
                .proofNote(invoice.getProofNote())
                .proofSubmittedAt(invoice.getProofSubmittedAt())
                .proofReviewedAt(invoice.getProofReviewedAt())
                .proofReviewNote(invoice.getProofReviewNote())
                .bankAccountNumber(landlord != null ? landlord.getBankAccountNumber() : null)
                .bankName(landlord != null ? landlord.getBankName() : null)
                .bankAccountName(landlord != null ? landlord.getBankAccountName() : null)
                .bankCode(landlord != null ? landlord.getBankCode() : null)
                .dueDate(invoice.getDueDate())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }

    private Invoice getInvoiceAndCheckTenantOwnership(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Hóa đơn không tồn tại!"));

        Integer tenantId = authService.getCurrentTenantId();
        Integer ownerId = Optional.of(invoice)
                .map(Invoice::getRentedRoom)
                .map(RentedRoom::getTenant)
                .map(Tenant::getTenantId)
                .orElse(null);

        if (!Objects.equals(tenantId, ownerId)) {
            throw new IllegalArgumentException("Bạn không có quyền thao tác hóa đơn này!");
        }

        return invoice;
    }

    private Invoice getInvoiceAndCheckOwnership(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Hóa đơn không tồn tại!"));

        Integer landlordId = authService.getCurrentLandlordId();
        Integer ownerId = Optional.of(invoice)
                .map(Invoice::getRentedRoom)
                .map(RentedRoom::getRoom)
                .map(Room::getHouse)
                .map(house -> house.getLandlord().getLandlordId())
                .orElse(null);

        if (!Objects.equals(landlordId, ownerId)) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập hóa đơn này!");
        }

        return invoice;
    }

    private RentedRoom getRentedRoomAndCheckOwnership(Integer rrId) {
        RentedRoom rentedRoom = rentedRoomRepository.findById(rrId)
                .orElseThrow(() -> new IllegalArgumentException("Hợp đồng không tồn tại!"));

        Integer landlordId = authService.getCurrentLandlordId();
        Integer ownerId = Optional.of(rentedRoom)
                .map(RentedRoom::getRoom)
                .map(Room::getHouse)
                .map(house -> house.getLandlord().getLandlordId())
                .orElse(null);

        if (!Objects.equals(landlordId, ownerId)) {
            throw new IllegalArgumentException("Bạn không có quyền tạo hóa đơn cho hợp đồng này!");
        }

        return rentedRoom;
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return null;
        }

        try {
            return YearMonth.parse(month);
        } catch (Exception e) {
            throw new IllegalArgumentException("Định dạng tháng không hợp lệ. Dùng YYYY-MM");
        }
    }

    private record ComponentAmounts(
            BigDecimal price,
            BigDecimal waterPrice,
            BigDecimal internetPrice,
            BigDecimal generalPrice,
            BigDecimal electricityPrice,
            Integer electricityNum,
            Integer waterNum,
            BigDecimal totalAmount
    ) {
    }
}

