package de.projekt.backend;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Aufgabe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long aufgabeId;

    @Column(nullable = false)
    private String titel;
    @Column(nullable = false)
    private String beschreibung;
    @Column(nullable = false)
    private LocalDate startDatum;
    @Column(nullable = false)
    private LocalDate endDatum;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AufgabenStatus status;
    
    @ManyToOne
    @JoinColumn(name = "projekt_id", nullable = false)
    private Projekt projekt;
    
    @ManyToOne
    @JoinColumn(name = "bearbeiter_id", nullable = false)
    private Benutzer benutzer;

    // Konstruktoren
    public Aufgabe() {}

    public Aufgabe(String titel, String beschreibung, LocalDate startDatum, LocalDate endDatum, AufgabenStatus status, Projekt projekt, Benutzer benutzer) {
        this.titel = titel;
        this.beschreibung = beschreibung;
        this.startDatum = startDatum;
        this.endDatum = endDatum;
        this.status = status;
        this.projekt = projekt;
        this.benutzer = benutzer;
    }

    // Getter & Setter
    public Long getAufgabeId() { return aufgabeId; }

    public String getTitel() { return titel; }
    public void setTitel(String titel) { this.titel = titel; }

    public String getBeschreibung() { return beschreibung; }
    public void setBeschreibung(String beschreibung) { this.beschreibung = beschreibung; }

    public LocalDate getStartDatum() { return startDatum; }
    public void setStartDatum(LocalDate startDatum) { this.startDatum = startDatum; }
    
    public LocalDate getEndDatum() { return endDatum; }
    public void setEndDatum(LocalDate endDatum) { this.endDatum = endDatum; }
    
    public AufgabenStatus getStatus() { return status; }
    public void setStatus(AufgabenStatus status) { this.status = status; }
    
    public Projekt getProjekt() { return projekt; }
    public void setProjekt(Projekt projekt) { this.projekt = projekt; }
    
    public Benutzer getBenutzer() { return benutzer; }
    public void setBenutzer(Benutzer benutzer) { this.benutzer = benutzer; }
}