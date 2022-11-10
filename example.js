const fs = require('fs').promises
const { Schematic } = require('prismarine-schematic')

async function main () {
  const schematic = await Schematic.read(await fs.readFile('test/schematics/smallhouse1.schem'))

  await fs.writeFile('test.schem', await schematic.write())

  const schematic2 = await Schematic.read(await fs.readFile('test.schem'))

  console.log("____________")
  console.log(schematic2)

  const schematic3 = await Schematic.read(await fs.readFile('test/schematics/Zombie_Box.litematic'));
  
  console.log(schematic3);
}

main()
