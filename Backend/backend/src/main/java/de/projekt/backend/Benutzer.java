package de.projekt.backend;

import jakarta.persistence.CascadeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;

@Entity
public class Benutzer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long benutzerId;

    @Column(nullable = false, unique = true)
    private String benutzername;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String passwortHash;
    @Column(nullable = false)
    private boolean aktiv;
    @Column(nullable = false)
    private boolean zweiFaktorAktiv;

    @JsonIgnore
    @Column
    private String zweiFaktorSecret;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rolle rolle;
    
    @JsonIgnore
    @OneToMany(mappedBy = "benutzer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjektMitarbeiter> projektZuordnungen = new ArrayList<>();
    
    // Konstruktoren
    public Benutzer() {}

    public Benutzer(String benutzername, String email, String passwortHash, boolean aktiv, boolean zweiFaktorAktiv, Rolle rolle) {
        this.benutzername = benutzername;
        this.email = email;
        this.passwortHash = passwortHash;
        this.aktiv = aktiv;
        this.zweiFaktorAktiv = zweiFaktorAktiv;
        this.rolle = rolle;
    }

    // Getter & Setter
    public Long getBenutzerId() { return benutzerId; }

    public String getBenutzername() { return benutzername; }
    public void setBenutzername(String benutzername) { this.benutzername = benutzername; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswortHash() { return passwortHash; }
    public void setPasswortHash(String passwortHash) {this.passwortHash = passwortHash; }
    
    public boolean isAktiv() { return aktiv; }
    public void setAktiv (boolean aktiv) { this.aktiv = aktiv; }
    
    public boolean isZweiFaktorAktiv() { return zweiFaktorAktiv; }
    public void setZweiFaktorAktiv (boolean zweiFaktorAktiv) { this.zweiFaktorAktiv = zweiFaktorAktiv; }
    
    public String getZweiFaktorSecret() { return zweiFaktorSecret; }
    public void setZweiFaktorSecret(String zweiFaktorSecret) { this.zweiFaktorSecret = zweiFaktorSecret; }
    
    public Rolle getRolle() { return rolle; }
    public void setRolle(Rolle rolle) { this.rolle = rolle; }
    
    public List<ProjektMitarbeiter> getProjektZuordnungen() { return projektZuordnungen; }
    public void setProjektZuordnungen(List<ProjektMitarbeiter> projektZuordnungen) { this.projektZuordnungen = projektZuordnungen; }
}