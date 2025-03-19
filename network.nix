{
  network = {
    pkgs = import
      (builtins.fetchGit {
        name = "nixos-23.11-2024-07-09";
        url = "https://github.com/NixOS/nixpkgs";
        ref = "refs/heads/nixos-23.11";
        rev = "205fd4226592cc83fd4c0885a3e4c9c400efabb5"; # Latest 23.11 commit as of March 2025
      })
      { };
  };

  nixie = { modulesPath, lib, name, pkgs, ... }: {
    imports = lib.optional (builtins.pathExists ./do-userdata.nix) ./do-userdata.nix ++ [
      (modulesPath + "/virtualisation/digital-ocean-config.nix")
    ];
    nixpkgs.system = "x86_64-linux";

    deployment.targetHost = "<IP_ADDRESS>";
    deployment.targetUser = "<USER>";

    networking.hostName = name;
    system.stateVersion = "23.11"; # Updated to match

    documentation.nixos.enable = false;

    boot.loader.grub.enable = false;
    boot.kernelPackages = pkgs.linuxPackages_latest;
    boot.initrd.availableKernelModules = [ "virtio_blk" "virtio_pci" "virtio_net" ];

    networking.firewall.allowedTCPPorts = [ 80 443 ];

    environment.systemPackages = with pkgs; [
      (buildNpmPackage rec {
        name = "superpromptor";
        src = /home/brettsmith/Developer/ai/superpromptor;
        npmDepsHash = "sha256-5vWU6huWACME5NA7VYeoJ9juf424TZLRsPlXm8vfACY="; # Replace after first build
        buildPhase = ''
          ${nodejs}/bin/npm run build
        '';
        installPhase = ''
          mkdir -p $out/app
          cp -r .next $out/app/.next
          cp -r public $out/app/public
          cp -r node_modules $out/app/node_modules
          cp -r starter-templates $out/app/starter-templates
          cp package.json $out/app/package.json
          cp -r next.config.ts $out/app/next.config.ts  # Include if you have this file
        '';
      })
      nodejs
      certbot
    ];

    # Systemd service for superpromptor
    systemd.services.superpromptor = {
      description = "Superpromptor Next.js Application";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      environment = {
        NODE_ENV = "production";
        PORT = "3000";
      };
      serviceConfig = {
        ExecStart = "${pkgs.nodejs}/bin/node ${pkgs.buildNpmPackage {
          name = "superpromptor";
          src = /home/brettsmith/Developer/ai/superpromptor;
          npmDepsHash = "sha256-5vWU6huWACME5NA7VYeoJ9juf424TZLRsPlXm8vfACY=";
          buildPhase = "${pkgs.nodejs}/bin/npm run build";
          installPhase = "mkdir -p $out/app; cp -r starter-templates $out/app/starter_templates; cp -r .next $out/app/.next; cp -r public $out/app/public; cp -r node_modules $out/app/node_modules; cp package.json $out/app/package.json; cp -r next.config.ts $out/app/next.config.ts || true";
        }}/app/node_modules/next/dist/bin/next start";
        Restart = "always";
        WorkingDirectory = "${pkgs.buildNpmPackage {
          name = "superpromptor";
          src = /home/brettsmith/Developer/ai/superpromptor;
          npmDepsHash = "sha256-5vWU6huWACME5NA7VYeoJ9juf424TZLRsPlXm8vfACY=";
          buildPhase = "${pkgs.nodejs}/bin/npm run build";
          installPhase = "mkdir -p $out/app; cp -r starter-templates $out/app/starter-templates; cp -r .next $out/app/.next; cp -r public $out/app/public; cp -r node_modules $out/app/node_modules; cp package.json $out/app/package.json; cp -r next.config.ts $out/app/next.config.ts || true";
        }}/app";
        User = "root"; # Still recommend creating a dedicated user
      };
    };

    security.acme = {
      acceptTerms = true; # You must agree to Let's Encrypt terms
      defaults.email = "<EMAIL>"; # Replace with your email
      certs."superpromptor.com" = {
        domain = "superpromptor.com"; # Replace with your domain
        extraDomainNames = [ "www.superpromptor.com" ]; # Optional: add subdomains
        group = "nginx"; # Ensure Nginx can read the certificates
      };
    };

    services.nginx = {
      enable = true;
      recommendedTlsSettings = true;
      recommendedOptimisation = true;
      recommendedGzipSettings = true;
      recommendedProxySettings = true;

      virtualHosts."superpromptor.com" = {
        # Use ACME-generated certificates
        enableACME = true; # This ties it to the security.acme.certs above
        forceSSL = true; # Redirect HTTP to HTTPS

        locations = {
          "/" = {
            proxyPass = "http://localhost:3000";
            proxyWebsockets = true;
            extraConfig = ''
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
            '';
          };
        };
      };
    };

    deployment.healthChecks = {
      http = [
        {
          scheme = "https";
          port = 443;
          path = "/";
          host = "superpromptor.com"; # Replace with your domain
          description = "check that nginx and superpromptor are running over HTTPS";
        }
      ];
    };
  };
}
