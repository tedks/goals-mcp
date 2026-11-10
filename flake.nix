{
  description = "Goals MCP Bazel development toolchain";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/a82ccc39b39b621151d6732718e3e250109076fa";
  inputs.bazel-nixpkgs.url = "github:NixOS/nixpkgs/56c02bc00adcf003215cc4bd996d6efaf4cff188";

  outputs = { nixpkgs, bazel-nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
    in {
      devShells = nixpkgs.lib.genAttrs systems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          bazelPkgs = import bazel-nixpkgs { inherit system; };
        in {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs_22 pkgs.pnpm pkgs.buildifier bazelPkgs.bazel_8 ];
          };
        });
    };
}
