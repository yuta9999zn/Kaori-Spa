package vn.kaori.spa.booking.payment;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

/**
 * POS-style 80mm thermal receipt for a single payment transaction.
 *
 * Page width 80mm × 250mm tall, 6mm margins. Designed for ESC/POS printers
 * but renders fine in any PDF viewer (showing all margins so cashiers can
 * preview before printing on actual thermal paper).
 */
@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
public class ReceiptPdfController {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withLocale(new Locale("vi"));
    private static final NumberFormat MONEY = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    private final TransactionRepository txRepo;

    @GetMapping(value = "/{id}/receipt", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> receipt(@PathVariable UUID id) {
        var tx = txRepo.findById(id).orElseThrow();

        // 80mm × 250mm. iText points: 1mm = 2.834 pt
        Rectangle pageSize = new Rectangle(226.77f, 708.66f);
        Document doc = new Document(pageSize, 16, 16, 16, 16);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(74, 68, 62));
        Font subFont   = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(139, 131, 124));
        Font normal    = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(74, 68, 62));
        Font small     = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(74, 68, 62));
        Font total     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(201, 168, 124));

        // Brand header.
        var brand = new Paragraph("NATURAL BEAUTY", brandFont);
        brand.setAlignment(Element.ALIGN_CENTER);
        doc.add(brand);

        var addr = new Paragraph("Kim Mã, Ba Đình, Hà Nội", subFont);
        addr.setAlignment(Element.ALIGN_CENTER);
        doc.add(addr);
        doc.add(divider());

        // Receipt meta.
        addRow(doc, normal, "Số:", tx.getReceiptNo() == null ? "—" : tx.getReceiptNo());
        addRow(doc, normal, "Ngày:", DT.format(tx.getPaidAt().atZone(ZONE)));
        addRow(doc, normal, "Phương thức:", methodLabel(tx.getMethodCode()));
        if (tx.getCustomerName() != null) addRow(doc, normal, "Khách:", tx.getCustomerName());
        if (tx.getCustomerPhone() != null) addRow(doc, normal, "SĐT:", tx.getCustomerPhone());
        if (tx.getBookingId() != null) addRow(doc, small, "Booking:", tx.getBookingId().toString().substring(0, 8));
        doc.add(divider());

        // Total row.
        var totalP = new Paragraph();
        var lbl = new Phrase("TỔNG", normal); totalP.add(lbl);
        totalP.setAlignment(Element.ALIGN_LEFT);
        doc.add(totalP);
        var amount = new Paragraph(MONEY.format(tx.getAmount()), total);
        amount.setAlignment(Element.ALIGN_RIGHT);
        doc.add(amount);
        doc.add(divider());

        // Footer.
        var thanks = new Paragraph("Cảm ơn quý khách", subFont);
        thanks.setAlignment(Element.ALIGN_CENTER);
        doc.add(thanks);

        var trace = new Paragraph(tx.getId().toString().substring(0, 8), subFont);
        trace.setAlignment(Element.ALIGN_CENTER);
        doc.add(trace);

        doc.close();

        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"receipt-" + (tx.getReceiptNo() == null ? id : tx.getReceiptNo()) + ".pdf\"");
        return ResponseEntity.ok().headers(h).body(out.toByteArray());
    }

    private static void addRow(Document doc, Font f, String label, String value) {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        try { t.setWidths(new float[]{ 4, 6 }); } catch (DocumentException ignored) {}
        t.addCell(cell(label, f, Element.ALIGN_LEFT));
        t.addCell(cell(value, f, Element.ALIGN_RIGHT));
        doc.add(t);
    }

    private static PdfPCell cell(String text, Font f, int align) {
        var c = new PdfPCell(new Phrase(text, f));
        c.setBorder(0);
        c.setHorizontalAlignment(align);
        c.setPaddingTop(2);
        c.setPaddingBottom(2);
        return c;
    }

    private static Paragraph divider() {
        var p = new Paragraph("- - - - - - - - - - - - - - - - - - - - - - - -",
                FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(200, 195, 190)));
        p.setAlignment(Element.ALIGN_CENTER);
        return p;
    }

    private static String methodLabel(String code) {
        return switch (code) {
            case "tm"     -> "Tiền mặt";
            case "the"    -> "Thẻ";
            case "ck-loc" -> "CK chi nhánh";
            case "ck-cty" -> "CK công ty";
            case "vi-mom" -> "Ví điện tử";
            default       -> code;
        };
    }
}
