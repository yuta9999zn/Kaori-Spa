package vn.kaori.spa.customer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"vn.kaori.spa.customer", "vn.kaori.spa.shared"})
public class CustomerApplication {
    public static void main(String[] args) { SpringApplication.run(CustomerApplication.class, args); }
}
