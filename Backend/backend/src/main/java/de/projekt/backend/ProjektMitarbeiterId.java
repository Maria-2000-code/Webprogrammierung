package de.projekt.backend;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Embeddable;

@Embeddable
public class ProjektMitarbeiterId implements Serializable {

	private Long projektId;
    private Long benutzerId;
    
    // Konstruktor
    public ProjektMitarbeiterId() {}

    public ProjektMitarbeiterId(Long projektId, Long benutzerId) {
        this.projektId = projektId;
        this.benutzerId = benutzerId;
    }

    // Getter & Setter
    public Long getProjektId() { return projektId; }
    public void setProjektId(Long projektId) { this.projektId = projektId; }

    public Long getBenutzerId() { return benutzerId; }
    public void setBenutzerId(Long benutzerId) { this.benutzerId = benutzerId; }
    
    // Vergleicht zwei ProjektMitarbeiterId
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjektMitarbeiterId)) return false;
        ProjektMitarbeiterId that = (ProjektMitarbeiterId) o;
        return Objects.equals(projektId, that.projektId) && Objects.equals(benutzerId, that.benutzerId);
    }

    // Hash-Code
    @Override
    public int hashCode() {
        return Objects.hash(projektId, benutzerId);
    }
}