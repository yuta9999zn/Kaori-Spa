package vn.kaori.spa.booking.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "staff_skills", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class StaffSkill {

    @EmbeddedId
    private Id id;

    @Column(name = "skill_level", nullable = false)
    private int skillLevel = 1;

    public StaffSkill(UUID staffId, String serviceCode, int skillLevel) {
        this.id = new Id(staffId, serviceCode);
        this.skillLevel = skillLevel;
    }

    @Embeddable
    @Getter @Setter @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "staff_id") private UUID staffId;
        @Column(name = "service_code") private String serviceCode;

        public Id(UUID staffId, String serviceCode) {
            this.staffId = staffId;
            this.serviceCode = serviceCode;
        }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id that)) return false;
            return Objects.equals(staffId, that.staffId) && Objects.equals(serviceCode, that.serviceCode);
        }
        @Override public int hashCode() { return Objects.hash(staffId, serviceCode); }
    }
}
