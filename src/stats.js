
class WizardInterface {
    HP;
    ATK;
    Mana;
    DEF;
    takeDamage(damage) {
        this.HP -= damage;
    }
}

/** @implements {WizardInterface} */
class FireWizard {
    constructor(HP = 100, ATK = 10, Mana = 50, DEF = 10) {
        this.HP = HP;
        this.ATK = ATK;
        this.Mana = Mana;
        this.DEF = DEF;
    }
}

class MindWizard {
    constructor(HP = 75, ATK = 20, Mana = 75, DEF = 7) {
        this.HP = HP;
        this.ATK = ATK;
        this.Mana = Mana;
        this.DEF = DEF;
    }
}

class EarthWizard {
    constructor(HP = 150, ATK = 10, Mana = 35, DEF = 20) {
        this.HP = HP;
        this.ATK = ATK;
        this.Mana = Mana;
        this.DEF = DEF;
    }
}