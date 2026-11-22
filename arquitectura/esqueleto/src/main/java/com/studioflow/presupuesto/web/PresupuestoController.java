package com.studioflow.presupuesto.web;

import com.studioflow.presupuesto.aplicacion.ServicioPresupuesto;
import com.studioflow.presupuesto.dominio.Presupuesto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/presupuesto")
class PresupuestoController {

    private final ServicioPresupuesto presupuestos;

    PresupuestoController(ServicioPresupuesto presupuestos) {
        this.presupuestos = presupuestos;
    }

    @GetMapping("/{produccionId}")
    ResponseEntity<Presupuesto> consultar(@PathVariable long produccionId) {
        return ResponseEntity.of(presupuestos.consultar(produccionId));
    }
}
