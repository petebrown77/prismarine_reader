const { parse } = require('prismarine-nbt');
const { Vec3 } = require('vec3');
const { Schematic } = require('../index.js');
const versions = require('minecraft-data').versions.pc
const { parseBlockName, getStateId } = require('./states')

class MC_Entity {
    constructor(id, position, isBaby = false) {
      this.id = id;
      this.position = position;
      if (isBaby === true) {
          this.isBaby = true;
      }
      this.x = this.position[0];
      this.y = this.position[1];
      this.z = this.position[2];
      this.name = this.id.substring(this.id.indexOf(":") + 1);
    }
}

function getMaxBitsRequired(blockPalette) {
    return Math.max(Math.ceil(Math.log2(blockPalette.length)), 2)
}

function read(nbt, version, fallbackBlock="stone") {
    if (!version) {
        version = "1.16.4"
    }
    const { Schematic } = require('../')

    const mcData = require('minecraft-data')(version)

    var block_palette = [];
    var blocks = [];
    const entity_holder = [];

    for (const region_name of Object.keys(nbt.Regions)) {
        
        const region = nbt.Regions[region_name];
        const region_palette = [];

        const blockPalette = region.BlockStatePalette;
        for (const block of blockPalette) {
            const name = parseBlockName(block["Name"]);
            const property = block["Properties"] || {};
            const stateId = getStateId(mcData, name.name, Object.entries(property));

            if (region_palette.indexOf(stateId) == -1) region_palette.push(stateId)
        }
        const blockStates = region.BlockStates;

        const nbits = getMaxBitsRequired(blockPalette);
        const mask = (1 << nbits) - 1;

        const size = region.Size;
        const regionVolume = Math.abs(size.x * size.y * size.z);

        const regionBlocks = [];

        for (var i = 0; i < regionVolume; i++) {
            const start_offset = BigInt(i * nbits);
            const start_index = BigInt(start_offset >> 6n); //gets index of list to get number to operate on

            const end_index = BigInt((i + 1) * nbits - 1) >> 6n;
            const start_bit_offset = BigInt(start_offset & 0x3Fn);

            const bigint_mask = BigInt(mask);

            if (start_index === end_index) {
                regionBlocks[i] = region_palette[Number(blockStates[Number(start_index)] >> start_bit_offset & bigint_mask)];
            } else {
                const end_offset = 64n - start_bit_offset;
                const value = blockStates[Number(start_index)] >> start_bit_offset | blockStates[Number(end_index)] << end_offset;
                regionBlocks[i] = region_palette[Number(value & bigint_mask)];
            }
        }
        //blocks = [...blocks, ...regionBlocks];
        block_palette = block_palette.concat(region_palette);
        blocks = blocks.concat(regionBlocks);

        for (const entity of region.Entities) {
            const id = entity.id;
            const position = entity.Pos;
            const is_Baby = entity.IsBaby;

            const e = new MC_Entity(id, position, is_Baby);
            entity_holder.push(e);
        }

    }

    const size = new Vec3(nbt.Metadata.EnclosingSize.x, nbt.Metadata.EnclosingSize.y, nbt.Metadata.EnclosingSize.z);
    const offset = new Vec3(0, 0, 0); //For some reason, Litematica doesn't use offset;

    return new Schematic(version, size, offset, block_palette, blocks, entity_holder)
}

module.exports = { read }