import { execSync } from "child_process";

function run(file: string) {
  console.log(`\n🚀 Running ${file}...\n`);
  execSync(`npx ts-node scripts/${file}`, { stdio: "inherit" });
}

function main() {
  run("seed-admin.ts");
  run("seed-employees.ts");
  run("seed-customers.ts");

  console.log("\n✅ ALL DONE");
}

main();