package de.projekt.backend;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public class Projekt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projektId;

    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String beschreibung;
    @Column(nullable = false)
    private LocalDate startDatum;
    @Column(nullable = false)
    private LocalDate endDatum;
    @Column(nullable = false)
    private Boolean archiviert;
    @Column(nullable = false)
    private String auftraggeber;
    
    @ManyToOne
    @JoinColumn(name = "leiter_id", nullable = false)
    private Benutzer benutzer;
    
    @JsonIgnore
    @OneToMany(mappedBy = "projekt", cascade = CascadeType.ALL)
    private List<Aufgabe> aufgaben = new ArrayList<>();
    
    @OneToMany(mappedBy = "projekt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProjektMitarbeiter> mitarbeiterZuordnungen = new ArrayList<>();

    // Konstruktoren
    public Projekt() {}

    public Projekt(String name, String beschreibung, LocalDate startDatum, LocalDate endDatum, boolean archiviert, String auftraggeber, Benutzer benutzer) {
        this.name = name;
        this.beschreibung = beschreibung;
        this.startDatum = startDatum;
        this.endDatum = endDatum;
        this.archiviert = archiviert;
        this.auftraggeber = auftraggeber;
        this.benutzer = benutzer;
    }

    // Getter & Setter
    public Long getProjektId() { return projektId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBeschreibung() { return beschreibung; }
    public void setBeschreibung(String beschreibung) { this.beschreibung = beschreibung; }

    public LocalDate getStartDatum() { return startDatum; }
    public void setStartDatum(LocalDate startDatum) {this.startDatum = startDatum; }
    
    public LocalDate getEndDatum() { return endDatum; }
    public void setEndDatum(LocalDate endDatum) { this.endDatum = endDatum; }
    
    public Boolean isArchiviert() { return archiviert; }
    public void setArchiviert(Boolean archiviert) { this.archiviert = archiviert != null ? archiviert : false; }
    
    public String getAuftraggeber() { return auftraggeber; }
    public void setAuftraggeber(String auftraggeber) { this.auftraggeber = auftraggeber; }
    
    public Benutzer getBenutzer() { return benutzer; }
    public void setBenutzer(Benutzer benutzer) { this.benutzer = benutzer; }
    
    public List<Aufgabe> getAufgaben() { return aufgaben; }
    public void setAufgaben(List<Aufgabe> aufgaben) { this.aufgaben = aufgaben; }
    
    public List<ProjektMitarbeiter> getMitarbeiterZuordnungen() { return mitarbeiterZuordnungen; }
    public void setMitarbeiterZuordnungen(List<ProjektMitarbeiter> mitarbeiterZuordnungen) { this.mitarbeiterZuordnungen = mitarbeiterZuordnungen; }
    
    // Aufgaben eines Projekts zurückgeben
    public int getAufgabenGesamt() { return aufgaben != null ? aufgaben.size() : 0; }
    
    // Erledigte Aufgaben eines Projekts zurückgeben
    public int getAufgabenErledigt() {
        if (aufgaben == null || aufgaben.isEmpty()) {
            return 0;
        }
        return (int) aufgaben.stream()
            .filter(a -> a.getStatus() == AufgabenStatus.ERLEDIGT || "ERLEDIGT".equalsIgnoreCase(String.valueOf(a.getStatus())))
            .count();
    }
    
    // Fortschritt berechnen
    public double berechneFortschritt() {
        if (aufgaben == null || aufgaben.isEmpty()) {
            return 0.0;
        }
        
        long erledigteAnzahl = aufgaben.stream()
            .filter(a -> a.getStatus() == AufgabenStatus.ERLEDIGT)
            .count();
            
        return (double) erledigteAnzahl / aufgaben.size() * 100.0;
    }
    
    // Projekt archivieren
    public void archivieren() { this.archiviert = true; }
    
    // MItarbeiter eines Projekts ausgeben
    public List<Long> getMitarbeiterIds() {
        List<Long> ids = new ArrayList<>();
        if (mitarbeiterZuordnungen != null) {
            for (ProjektMitarbeiter pm : mitarbeiterZuordnungen) {
                if (pm.getBenutzer() != null) {
                    ids.add(pm.getBenutzer().getBenutzerId());
                }
            }
        }
        return ids;
    }
}