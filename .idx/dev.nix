# This is a Nix configuration file for the development environment.
# It specifies the tools and packages that should be available in your workspace.
{ pkgs, ... }: {

  # Use the stable-23.11 Nixpkgs channel for reproducibility.
  channel = "stable-23.11";

  # A list of packages to install.
  # Packages are separated by spaces, not commas.
  packages = [
    # Provides Node.js, which is required to run your Next.js application.
    pkgs.nodejs_22

    # Provides the Firebase CLI for deploying your project and running emulators.
    pkgs.firebase-tools

    # The Java Development Kit is sometimes required by the Firebase emulators.
    pkgs.jdk
    
    # Provides the curl command.
    pkgs.curl
  ];

  # Environment variables can be set here, but for Next.js, it's best
  # to use .env.local and .env files, which are automatically loaded.
  env = {};
}
