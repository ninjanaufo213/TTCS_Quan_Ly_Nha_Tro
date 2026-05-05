package com.example.demo.controller;

import com.example.demo.dto.InvoiceRequest;
import com.example.demo.dto.InvoiceResponse;
import com.example.demo.service.FileStorageService;
import com.example.demo.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final FileStorageService fileStorageService;

    @GetMapping("/")
    public ResponseEntity<?> getAllInvoices(
            @RequestParam(value = "month", required = false) String month,
            @RequestParam(value = "house_id", required = false) Integer houseId,
            @RequestParam(value = "room_id", required = false) Integer roomId,
            @RequestParam(value = "is_paid", required = false) Boolean isPaid
    ) {
        try {
            List<InvoiceResponse> invoices = invoiceService.getAllInvoices(month, houseId, roomId, isPaid);
            return ResponseEntity.ok(invoices);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tải hóa đơn: " + e.getMessage());
        }
    }

    @GetMapping("/rented-room/{rrId}")
    public ResponseEntity<?> getInvoicesByRentedRoom(@PathVariable Integer rrId) {
        try {
            List<InvoiceResponse> invoices = invoiceService.getInvoicesByRentedRoom(rrId);
            return ResponseEntity.ok(invoices);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tải hóa đơn theo hợp đồng: " + e.getMessage());
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingInvoices() {
        try {
            List<InvoiceResponse> invoices = invoiceService.getPendingInvoices();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tải hóa đơn chưa thanh toán: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable("id") Integer id) {
        try {
            InvoiceResponse invoice = invoiceService.getInvoiceById(id);
            return ResponseEntity.ok(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tải hóa đơn: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyInvoices() {
        try {
            List<InvoiceResponse> invoices = invoiceService.getMyInvoices();
            return ResponseEntity.ok(invoices);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tải hóa đơn của bạn: " + e.getMessage());
        }
    }

    @PostMapping("/")
    public ResponseEntity<?> createInvoice(@RequestBody InvoiceRequest request) {
        try {
            InvoiceResponse invoice = invoiceService.createInvoice(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tạo hóa đơn: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvoice(@PathVariable("id") Integer id, @RequestBody InvoiceRequest request) {
        try {
            InvoiceResponse invoice = invoiceService.updateInvoice(id, request);
            return ResponseEntity.ok(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi cập nhật hóa đơn: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payInvoice(@PathVariable("id") Integer id) {
        try {
            InvoiceResponse invoice = invoiceService.payInvoice(id);
            return ResponseEntity.ok(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi thanh toán hóa đơn: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/proof")
    public ResponseEntity<?> submitPaymentProof(
            @PathVariable("id") Integer id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "note", required = false) String note
    ) {
        try {
            String fileUrl = fileStorageService.store("payment-proofs", file);
            InvoiceResponse invoice = invoiceService.submitPaymentProof(id, fileUrl, note);
            return ResponseEntity.ok(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi gửi minh chứng: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/proof/approve")
    public ResponseEntity<?> approvePaymentProof(
            @PathVariable("id") Integer id,
            @RequestParam(value = "note", required = false) String note
    ) {
        try {
            InvoiceResponse invoice = invoiceService.approvePaymentProof(id, note);
            return ResponseEntity.ok(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi duyệt thanh toán: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/proof/decline")
    public ResponseEntity<?> declinePaymentProof(
            @PathVariable("id") Integer id,
            @RequestParam(value = "note", required = false) String note
    ) {
        try {
            InvoiceResponse invoice = invoiceService.rejectPaymentProof(id, note);
            return ResponseEntity.ok(invoice);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi từ chối thanh toán: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(@PathVariable("id") Integer id) {
        try {
            invoiceService.deleteInvoice(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa hóa đơn thành công!");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return buildError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi xóa hóa đơn: " + e.getMessage());
        }
    }

    private ResponseEntity<Map<String, Object>> buildError(HttpStatus status, String detail) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("detail", detail);
        return ResponseEntity.status(status).body(response);
    }
}

