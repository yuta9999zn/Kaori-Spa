package vn.kaori.spa.inventory.domain;

/**
 * Legacy aggregator kept for backwards-compatible imports. Each repository
 * now lives in its own file so Spring Data JPA's component scan can pick
 * them up (nested interfaces inside a non-Spring class are not always
 * discovered).
 */
public final class Repos {
    private Repos() {}
}
