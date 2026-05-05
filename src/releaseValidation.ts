export type ReleasePackageJson = {
  name: string;
  version: string;
};

export type ReleaseServerJson = {
  name: string;
  version: string;
  packages?: Array<{
    identifier?: string;
    version?: string;
    transport?: { type?: string };
  }>;
};

export function validateReleaseMetadata(pkg: ReleasePackageJson, server: ReleaseServerJson): string[] {
  const errors: string[] = [];

  if (!pkg.name) errors.push("package.json name is required");
  if (!pkg.version) errors.push("package.json version is required");
  if (!server.name) errors.push("server.json name is required");
  if (!server.version) errors.push("server.json version is required");

  if (pkg.version && server.version && pkg.version !== server.version) {
    errors.push(`server.json version ${server.version} must match package.json version ${pkg.version}`);
  }

  const npmPackage = server.packages?.find((entry) => entry.identifier === pkg.name) ?? server.packages?.[0];
  if (!npmPackage) {
    errors.push("server.json packages[0] is required for npm publish metadata");
    return errors;
  }

  if (npmPackage.identifier !== pkg.name) {
    errors.push(`server.json package identifier ${npmPackage.identifier ?? "<missing>"} must match package.json name ${pkg.name}`);
  }

  if (npmPackage.version !== pkg.version) {
    errors.push(`server.json package version ${npmPackage.version ?? "<missing>"} must match package.json version ${pkg.version}`);
  }

  if (npmPackage.transport?.type !== "stdio") {
    errors.push(`server.json package transport.type ${npmPackage.transport?.type ?? "<missing>"} must be stdio`);
  }

  return errors;
}
