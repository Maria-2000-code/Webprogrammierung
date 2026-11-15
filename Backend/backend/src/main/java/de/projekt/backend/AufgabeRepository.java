package de.projekt.backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AufgabeRepository extends JpaRepository<Aufgabe, Long> {
}