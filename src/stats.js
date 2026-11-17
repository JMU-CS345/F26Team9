
class WizardStats {
    constructor(wizardClass) {
        const classStats = {
            Fire: [100, 30, 50, 10],
            Mind: [75, 50, 75, 7],
            Earth: [150, 50, 30, 20]
        };
        const stats = classStats[wizardClass];

        if (!stats) {
            throw new Error("Choose Fire, Mind, or Earth.");
        }

        this.wizardClass = wizardClass;
        [this.HP, this.ATK, this.Mana, this.DEF] = stats;
    }
}