with import
  (builtins.fetchTarball {
    name = "nixos-unstable-2020-08-26";
    url = "https://github.com/NixOS/nixpkgs/archive/f9567594d5af2926a9d5b96ae3bada707280bec6.tar.gz";
    sha256 = "0vr2di6z31c5ng73f0cxj7rj9vqvlvx3wpqdmzl0bx3yl3wr39y6";
  })
{ };
let
  nodejs = pkgs.nodejs;

  nodeEnv = import ./nix/node-env.nix {
    inherit (pkgs) stdenv python2 utillinux runCommand writeTextFile;
    inherit nodejs;
    libtool =
      if pkgs.stdenv.isDarwin then pkgs.darwin.cctools else null;
  };

  eslintPluginES5 = nodeEnv.buildNodePackage {
    name = "eslint-plugin-es5";
    packageName = "eslint-plugin-es5";
    version = "1.5.0";
    src = pkgs.fetchurl {
      url = "https://registry.npmjs.org/eslint-plugin-es5/-/eslint-plugin-es5-1.5.0.tgz";
      sha512 = "00gbihqbfam03qlswn893l74qf4z2knw5cmqis1ysbvxskxw839qxddfqh7w2r09dj5wlw9zwaiw7543n6jc4a5023b81znpfiry6a3";

    };
    buildInputs = [ ];
    meta = {
      description = "ESLint plugin for ES5 users.";
      homepage = "https://github.com/nkt/eslint-plugin-es5";
      license = "MIT";
    };
    production = true;
    bypassCache = true;
    reconstructLock = true;
  };

  eslintConfig = pkgs.writeText "eslintrc.json"
    (builtins.toJSON {
      plugins = [
        "es5"
      ];
      extends = [
        "eslint:recommended"
        "plugin:es5/no-es2015"
        "plugin:es5/no-es2016"
      ];
      globals = {
        cheats = "readonly";
        console = "readonly";
        context = "readonly";
        date = "readonly";
        map = "readonly";
        network = "readonly";
        park = "readonly";
        ui = "readonly";
        registerPlugin = "readonly";
      };
    });
in
pkgs.mkShell {
  nativeBuildInputs = [
    pkgs.nodePackages.prettier
    (pkgs.nodePackages.eslint.overrideAttrs
      (oldAttrs: {
        buildInputs = oldAttrs.buildInputs or [ ] ++ [ pkgs.makeWrapper ];
        postInstall = oldAttrs.postInstall or "" + ''
          wrapProgram $out/bin/eslint \
          --add-flags "-c ${eslintConfig.outPath}"
        '';
      }))
    eslintPluginES5
  ];

  NODE_PATH = "${eslintPluginES5}/lib/node_modules";
}
