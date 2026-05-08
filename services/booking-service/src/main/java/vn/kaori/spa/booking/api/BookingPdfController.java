package vn.kaori.spa.booking.api;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
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
 * Returns a one-page A5 PDF receipt / booking confirmation.
 *
 * Layout:
 *   - Header: tenant + branch + brand band
 *   - Booking code + barcode-like text
 *   - Customer info
 *   - Items table (service / time / price)
 *   - Total + footer
 *
 * Vietnamese diacritics: OpenPDF's default fonts include Helvetica which
 * doesn't render every Vietnamese glyph perfectly. For production swap to
 * a TTF (e.g. Roboto) loaded with FontFactory.register(...).
 */
@RestController
@RequestMapping("/v1/bookings")
@RequiredArgsConstructor
public class BookingPdfController {

    private final BookingService bookingService;

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DT =
            DateTimeFormatter.ofPattern("EEE dd/MM/yyyy HH:mm").withLocale(new Locale("vi"));
    private static final NumberFormat MONEY =
            NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        var b = bookingService.getDetail(id);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A5, 36, 36, 36, 36);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titleFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(74, 68, 62));
        Font hFont       = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(139, 131, 124));
        Font codeFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(201, 168, 124));
        Font normalFont  = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(74, 68, 62));
        Font bigFont     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(74, 68, 62));

        // ── Brand header ──
        var brand = new Paragraph("NATURAL BEAUTY", titleFont);
        brand.setAlignment(Element.ALIGN_CENTER);
        doc.add(brand);
        var sub = new Paragraph("Kaori Spa Platform", hFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        doc.add(sub);
        doc.add(new Paragraph(" "));

        // ── Code ──
        var code = new Paragraph(b.code(), codeFont);
        code.setAlignment(Element.ALIGN_CENTER);
        doc.add(code);
        var status = new Paragraph(b.status().toUpperCase() + " · " + b.source(), hFont);
        status.setAlignment(Element.ALIGN_CENTER);
        doc.add(status);
        doc.add(new Paragraph(" "));

        // ── Customer ──
        var customerLabel = new Paragraph("KHÁCH HÀNG", hFont);
        doc.add(customerLabel);
        doc.add(new Paragraph(b.customerName(), bigFont));
        doc.add(new Paragraph(b.customerPhone(), normalFont));
        if (b.customerEmail() != null && !b.customerEmail().isBlank()) {
            doc.add(new Paragraph(b.customerEmail(), normalFont));
        }
        doc.add(new Paragraph(" "));

        // ── Items table ──
        PdfPTable t = new PdfPTable(3);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{ 5, 3, 2 });
        t.addCell(headerCell("Dịch vụ", hFont));
        t.addCell(headerCell("Thời gian", hFont));
        t.addCell(headerCell("Giá", hFont));

        for (var it : b.items()) {
            t.addCell(bodyCell(it.serviceName().getOrDefault("vi", it.serviceCode()), normalFont, Element.ALIGN_LEFT));
            t.addCell(bodyCell(DT.format(it.startAt().atZone(ZONE)), normalFont, Element.ALIGN_LEFT));
            t.addCell(bodyCell(MONEY.format(it.price()), normalFont, Element.ALIGN_RIGHT));
        }
        doc.add(t);
        doc.add(new Paragraph(" "));

        // ── Total ──
        var total = new Paragraph("TỔNG: " + MONEY.format(b.totalAmount()), bigFont);
        total.setAlignment(Element.ALIGN_RIGHT);
        doc.add(total);

        // ── Footer ──
        doc.add(new Paragraph(" "));
        doc.add(new Paragraph(" "));
        var foot = new Paragraph("Cảm ơn bạn đã chọn Natural Beauty.", hFont);
        foot.setAlignment(Element.ALIGN_CENTER);
        doc.add(foot);
        var foot2 = new Paragraph("Vui lòng đến trước 5 phút và mang theo mã đặt lịch.", hFont);
        foot2.setAlignment(Element.ALIGN_CENTER);
        doc.add(foot2);

        doc.close();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"booking-" + b.code() + ".pdf\"");
        return ResponseEntity.ok().headers(headers).body(out.toByteArray());
    }

    private static PdfPCell headerCell(String text, Font f) {
        var c = new PdfPCell(new Phrase(text, f));
        c.setBorder(0);
        c.setBorderWidthBottom(1);
        c.setBorderColorBottom(new Color(244, 239, 234));
        c.setPaddingBottom(6);
        return c;
    }

    private static PdfPCell bodyCell(String text, Font f, int align) {
        var c = new PdfPCell(new Phrase(text, f));
        c.setBorder(0);
        c.setHorizontalAlignment(align);
        c.setPaddingTop(6);
        c.setPaddingBottom(6);
        return c;
    }
}
