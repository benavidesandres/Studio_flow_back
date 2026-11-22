package com.studioflow.arquitectura;

import com.studioflow.planificacion.infraestructura.PlantaDeAtajo;
import com.studioflow.presupuesto.aplicacion.AtajoPlantado;
import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Hace verificable el diseño: si alguien toma un atajo entre capas o módulos, la compilación de pruebas falla. */
class ReglasDeArquitecturaTest {

    private static final Pattern MODULO = Pattern.compile("^com\\.studioflow\\.(planificacion|reparto|presupuesto)(\\..*)?$");

    private static final JavaClasses CODIGO = new ClassFileImporter()
            .withImportOption(new ImportOption.DoNotIncludeTests())
            .importPackages("com.studioflow");

    private static final ArchCondition<JavaClass> ACCEDER_A_OTROS_MODULOS_SOLO_POR_CONTRATO =
            new ArchCondition<>("acceder a otros módulos solo por su contrato") {
                @Override
                public void check(JavaClass origen, ConditionEvents eventos) {
                    for (Dependency dependencia : origen.getDirectDependenciesFromSelf()) {
                        JavaClass destino = dependencia.getTargetClass();
                        String moduloDestino = moduloDe(destino);
                        boolean cruzaFrontera = moduloDestino != null && !moduloDestino.equals(moduloDe(origen));
                        if (cruzaFrontera && !destino.getPackageName().endsWith(".contrato")) {
                            eventos.add(SimpleConditionEvent.violated(dependencia, dependencia.getDescription()));
                        }
                    }
                }
            };

    private static final ArchRule MODULOS_SOLO_POR_CONTRATO = classes()
            .that().resideInAPackage("com.studioflow.*..")
            .should(ACCEDER_A_OTROS_MODULOS_SOLO_POR_CONTRATO);

    private static final List<ArchRule> REGLAS = List.of(
            MODULOS_SOLO_POR_CONTRATO,
            slices().matching("com.studioflow.(*)..").should().beFreeOfCycles(),
            classes().that().resideInAPackage("..dominio..")
                    .should().onlyDependOnClassesThat().resideInAnyPackage("..dominio..", "java.."),
            classes().that().resideInAPackage("..contrato..")
                    .should().onlyDependOnClassesThat().resideInAnyPackage("..contrato..", "java.."),
            noClasses().that().resideInAPackage("..aplicacion..")
                    .should().dependOnClassesThat().resideInAnyPackage("..web..", "..infraestructura.."),
            noClasses().that().resideInAPackage("..web..")
                    .should().dependOnClassesThat().resideInAPackage("..infraestructura.."),
            noClasses().that().resideInAPackage("..infraestructura..")
                    .should().dependOnClassesThat().resideInAnyPackage("..web..", "..aplicacion.."));

    private static String moduloDe(JavaClass clase) {
        Matcher coincidencia = MODULO.matcher(clase.getPackageName());
        return coincidencia.matches() ? coincidencia.group(1) : null;
    }

    @Test
    void elCodigoRespetaLasCapasYLasFronteras() {
        REGLAS.forEach(regla -> regla.check(CODIGO));
    }

    @Test
    void laReglaDetectaUnAtajoPlantadoEntreModulos() {
        JavaClasses conAtajo = new ClassFileImporter().importClasses(AtajoPlantado.class, PlantaDeAtajo.class);

        assertTrue(MODULOS_SOLO_POR_CONTRATO.evaluate(conAtajo).hasViolation());
    }
}
