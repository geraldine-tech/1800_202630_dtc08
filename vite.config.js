// vite.config.js
// Tells Vite's bundler (Rollup) that each of these HTML files is a page of its own.
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index:    resolve(__dirname, "index.html"),
                login:    resolve(__dirname, "login.html"),
                main:     resolve(__dirname, "main.html"),
                learn:  resolve(__dirname, "learn.html"),
                favorite: resolve(__dirname, "favorite.html"),
                profile:  resolve(__dirname, "profile.html"),
                skeleton: resolve(__dirname, "skeleton.html")
            }
        }
    }
});