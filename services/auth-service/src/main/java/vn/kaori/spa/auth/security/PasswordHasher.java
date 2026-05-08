package vn.kaori.spa.auth.security;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

    private final Argon2 argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);

    private static final int ITERATIONS = 3;
    private static final int MEMORY_KB  = 64 * 1024;
    private static final int PARALLELISM = 1;

    public String hash(String plain) {
        char[] chars = plain.toCharArray();
        try {
            return argon2.hash(ITERATIONS, MEMORY_KB, PARALLELISM, chars);
        } finally {
            argon2.wipeArray(chars);
        }
    }

    public boolean verify(String hash, String plain) {
        char[] chars = plain.toCharArray();
        try {
            return argon2.verify(hash, chars);
        } finally {
            argon2.wipeArray(chars);
        }
    }
}
