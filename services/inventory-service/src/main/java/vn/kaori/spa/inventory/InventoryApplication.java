package vn.kaori.spa.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"vn.kaori.spa.inventory", "vn.kaori.spa.shared"})
public class InventoryApplication {
    public static void main(String[] args) { SpringApplication.run(InventoryApplication.class, args); }
}
