package vn.kaori.spa.booking.domain;

import java.time.LocalTime;

/**
 * The four shift codes used by Natural Beauty (matching the customer's
 * Shift Management Excel workbook). The display names live in the i18n
 * bundle; this enum only carries timing.
 */
public enum ShiftType {
    SANG(LocalTime.of(9, 0),  LocalTime.of(15, 0), false),
    TOI (LocalTime.of(15, 0), LocalTime.of(21, 0), false),
    FULL(LocalTime.of(9, 0),  LocalTime.of(21, 0), false),
    NGHI(LocalTime.of(0, 0),  LocalTime.of(23, 59), true);

    public final LocalTime start;
    public final LocalTime end;
    public final boolean off;

    ShiftType(LocalTime s, LocalTime e, boolean off) {
        this.start = s; this.end = e; this.off = off;
    }
}
