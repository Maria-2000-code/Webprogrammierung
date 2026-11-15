package de.projekt.backend;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnore; // Wichtig!
import java.util.Objects;

@Entity
@Table(name = "projekt_mitarbeiter")
public class ProjektMitarbeiter {

    @EmbeddedId
    private ProjektMitarbeiterId id = new ProjektMitarbeiterId();

    @JsonIgnore
    @ManyToOne
    @MapsId("projektId") 
    @JoinColumn(name = "projekt_id")
    private Projekt projekt;

    @ManyToOne
    @MapsId("benutzerId") 
    @JoinColumn(name = "benutzer_id")
    private Benutzer benutzer;

    // Konstruktor
    public ProjektMitarbeiter() {}

    public ProjektMitarbeiter(Projekt projekt, Benutzer benutzer) {
        this.projekt = projekt;
        this.benutzer = benutzer;
    }

    // Getter & Setter
    public ProjektMitarbeiterId getId() { return id; }

    public Projekt getProjekt() { return projekt; }
    public void setProjekt(Projekt projekt) { this.projekt = projekt; }

    public Benutzer getBenutzer() { return benutzer; }
    public void setBenutzer(Benutzer benutzer) { this.benutzer = benutzer; }
    
    // Vergleicht zwei Projektmitarbeiter
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProjektMitarbeiter that = (ProjektMitarbeiter) o;
        return Objects.equals(projekt, that.projekt) && Objects.equals(benutzer, that.benutzer);
    }
    
    // Hash-Code
    @Override
    public int hashCode() {
        return Objects.hash(projekt, benutzer);
    }
}