package vn.kaori.spa.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"vn.kaori.spa.catalog", "vn.kaori.spa.shared"})
public class CatalogApplication {
    public static void main(String[] args) { SpringApplication.run(CatalogApplication.class, args); }
}
