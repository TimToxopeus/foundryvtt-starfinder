import { SFRPG } from "../../../config.js";

export default function (engine) {
    engine.closures.add("calculateChassis", (fact, context) => {
        const data = fact.data;

        const droneTable = {
            hitpoints: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 190, 210, 230],
            acBonus: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
            babBonus: [1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 15],
            goodSaveBonus: [2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 9, 9, 9],
            badSaveBonus: [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5],
            feats: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8],
            mods: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
            abilityIncreaseLevels: [4, 7, 10, 13, 16, 19]
        };

        // We only care about the first chassis
        let activeChassis = null;
        for (const chassis of fact.classes) {
            activeChassis = chassis;
            break;
        }

        data.traits.size = SFRPG.actorSizes[activeChassis.data.size];
        data.attributes.speed.value = activeChassis.data.speed.value;
        data.attributes.speed.special = activeChassis.data.speed.special;

        let droneLevel = activeChassis.data.levels;
        droneLevel = Math.max(1, Math.min(droneLevel, 20));

        data.details.level.value = droneLevel;
        data.attributes.hp.max = droneTable.hitpoints[droneLevel - 1];
        data.attributes.bab = droneTable.babBonus[droneLevel - 1];
        
        let abilityIncreaseStats = [activeChassis.data.abilityIncreaseStats.first, activeChassis.data.abilityIncreaseStats.second];
        let abilityIncreases = droneTable.abilityIncreaseLevels.filter(x => x <= droneLevel).length;

        data.attributes.eac.value = activeChassis.data.eac + droneTable.acBonus[droneLevel - 1];
        data.attributes.kac.value = activeChassis.data.kac + droneTable.acBonus[droneLevel - 1];
        data.attributes.cmd.value = data.attributes.kac.value + 8;

        data.attributes.fort.bonus = activeChassis.data.fort == "slow" ? droneTable.badSaveBonus[droneLevel - 1] : droneTable.goodSaveBonus[droneLevel - 1];
        data.attributes.reflex.bonus = activeChassis.data.ref == "slow" ? droneTable.badSaveBonus[droneLevel - 1] : droneTable.goodSaveBonus[droneLevel - 1];
        data.attributes.will.bonus = activeChassis.data.will == "slow" ? droneTable.badSaveBonus[droneLevel - 1] : droneTable.goodSaveBonus[droneLevel - 1];

        data.abilities.str.base = activeChassis.data.abilityScores.str + (abilityIncreaseStats.includes("str") ? abilityIncreases : 0);

        data.abilities.dex.base = activeChassis.data.abilityScores.dex + (abilityIncreaseStats.includes("dex") ? abilityIncreases : 0);

        data.abilities.con.value = activeChassis.data.abilityScores.con;
        data.abilities.con.mod = 0;

        data.abilities.int.base = activeChassis.data.abilityScores.int + (abilityIncreaseStats.includes("int") ? abilityIncreases : 0);

        data.abilities.wis.base = activeChassis.data.abilityScores.wis + (abilityIncreaseStats.includes("wis") ? abilityIncreases : 0);
        
        data.abilities.cha.base = activeChassis.data.abilityScores.cha + (abilityIncreaseStats.includes("cha") ? abilityIncreases : 0);

        // Clear out skills, this and future closures will enable them again
        let skillkeys = Object.keys(SFRPG.skills);
        for (let skill of skillkeys) {
            data.skills[skill].enabled = false;
            data.skills[skill].value = 0;
            data.skills[skill].ranks = 0;
            data.skills[skill].mod = 0;
            data.skills[skill].tooltip = [];
        }

        if (activeChassis.data.bonusSkillUnit) {
            let skill = data.skills[activeChassis.data.bonusSkillUnit];
            skill.enabled = true;
            skill.value = 3;
            skill.ranks = droneLevel;

            let tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
                type: "Class Skill",
                mod: skill.value.signedString(),
                source: activeChassis.name
            });

            skill.tooltip.push(tooltip);

            tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
                type: "Mechanic Level",
                mod: skill.ranks.signedString(),
                source: activeChassis.name
            });

            skill.tooltip.push(tooltip);
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}