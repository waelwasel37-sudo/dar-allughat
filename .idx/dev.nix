# This is a Nix configuration file for the development environment.
# It specifies the tools and packages that should be available in your workspace.
{ pkgs, ... }: {

  # Use the stable-24.05 Nixpkgs channel to get newer packages.
  channel = "stable-24.05";

  # A list of packages to install.
  # Packages are separated by spaces, not commas.
  packages = [
    # Updated to nodejs_22 to meet dependency requirements.
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
