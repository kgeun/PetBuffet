const TARGET_AGE_PUPPY = 1;
const TARGET_AGE_ADULT = 2;
const TARGET_AGE_OLD = 3;

const NUTRITION_GOOD = 0;
const NUTRITION_LACK = -1;
const NUTRITION_EXCESS = 1;

const PUPPY_PROTEIN_MAX = 50;
const PUPPY_PROTEIN_MIN = 22.5;
const PUPPY_FAT_MAX = 50;
const PUPPY_FAT_MIN = 8.5;
const PUPPY_CALCIUM_MAX = 2.5;
const PUPPY_CALCIUM_MIN = 1.2;
const PUPPY_PHOSPHORUS_MAX = 1.6;
const PUPPY_PHOSPHORUS_MIN = 1.0;

const ADULT_PROTEIN_MAX = 50;
const ADULT_PROTEIN_MIN = 18;
const ADULT_FAT_MAX = 50;
const ADULT_FAT_MIN = 5.5;
const ADULT_CALCIUM_MAX = 2.5;
const ADULT_CALCIUM_MIN = 0.5;
const ADULT_PHOSPHORUS_MAX = 1.6;
const ADULT_PHOSPHORUS_MIN = 0.4;

const OLD_PROTEIN_MAX = 50;
const OLD_PROTEIN_MIN = 18;
const OLD_FAT_MAX = 50;
const OLD_FAT_MIN = 5.5;
const OLD_CALCIUM_MAX = 2.5;
const OLD_CALCIUM_MIN = 0.5;
const OLD_PHOSPHORUS_MAX = 1.6;
const OLD_PHOSPHORUS_MIN = 0.4;

const assess_nutrition = body => {
    const { target_age_id, protein, fat, calcium, phosphorus } = body;
    let nutrition_info = {};
    let nutrition_score = NUTRITION_GOOD;

    if(target_age_id == TARGET_AGE_PUPPY) {
        // protein
        if(protein < PUPPY_PROTEIN_MIN){
            nutrition_info.eval_protein = NUTRITION_LACK;
        } else if(protein >= PUPPY_PROTEIN_MAX){
            nutrition_info.eval_protein = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_protein = NUTRITION_GOOD;
            nutrition_score++;
        }

        // fat
        if(fat < PUPPY_FAT_MIN){
            nutrition_info.eval_fat = NUTRITION_LACK;
        } else if(fat >= PUPPY_FAT_MAX){
            nutrition_info.eval_fat = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_fat = NUTRITION_GOOD;
            nutrition_score++;
        }

        //calcium
        if(calcium < PUPPY_CALCIUM_MIN){
            nutrition_info.eval_calcium = NUTRITION_LACK;
        } else if(calcium >= PUPPY_CALCIUM_MAX){
            nutrition_info.eval_calcium = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_calcium = NUTRITION_GOOD;
            nutrition_score++;
        }

        //phosphorus
        if(phosphorus < PUPPY_PHOSPHORUS_MIN){
            nutrition_info.eval_phosphorus = NUTRITION_LACK;
        } else if(phosphorus >= PUPPY_PHOSPHORUS_MAX){
            nutrition_info.eval_phosphorus = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_phosphorus = NUTRITION_GOOD;
            nutrition_score++;
        }

    } else if(target_age_id == TARGET_AGE_ADULT) {
        // protein
        if(protein < ADULT_PROTEIN_MIN){
            nutrition_info.eval_protein = NUTRITION_LACK;
        } else if(protein >= ADULT_PROTEIN_MAX){
            nutrition_info.eval_protein = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_protein = NUTRITION_GOOD;
            nutrition_score++;
        }

        // fat
        if(fat < ADULT_FAT_MIN){
            nutrition_info.eval_fat = NUTRITION_LACK;
        } else if(fat >= ADULT_FAT_MAX){
            nutrition_info.eval_fat = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_fat = NUTRITION_GOOD;
            nutrition_score++;
        }

        //calcium
        if(calcium < ADULT_CALCIUM_MIN){
            nutrition_info.eval_calcium = NUTRITION_LACK;
        } else if(calcium >= ADULT_CALCIUM_MAX){
            nutrition_info.eval_calcium = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_calcium = NUTRITION_GOOD;
            nutrition_score++;
        }

        //phosphorus
        if(phosphorus < ADULT_PHOSPHORUS_MIN){
            nutrition_info.eval_phosphorus = NUTRITION_LACK;
        } else if(phosphorus >= ADULT_PHOSPHORUS_MAX){
            nutrition_info.eval_phosphorus = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_phosphorus = NUTRITION_GOOD;
            nutrition_score++;
        }

    } else if(target_age_id == TARGET_AGE_OLD) {
        // protein
        if(protein < OLD_PROTEIN_MIN){
            nutrition_info.eval_protein = NUTRITION_LACK;
        } else if(protein >= OLD_PROTEIN_MAX){
            nutrition_info.eval_protein = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_protein = NUTRITION_GOOD;
            nutrition_score++;
        }

        // fat
        if(fat < OLD_FAT_MIN){
            nutrition_info.eval_fat = NUTRITION_LACK;
        } else if(fat >= OLD_FAT_MAX){
            nutrition_info.eval_fat = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_fat = NUTRITION_GOOD;
            nutrition_score++;
        }

        //calcium
        if(calcium < OLD_CALCIUM_MIN){
            nutrition_info.eval_calcium = NUTRITION_LACK;
        } else if(calcium >= OLD_CALCIUM_MAX){
            nutrition_info.eval_calcium = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_calcium = NUTRITION_GOOD;
            nutrition_score++;
        }

        //phosphorus
        if(phosphorus < OLD_PHOSPHORUS_MIN){
            nutrition_info.eval_phosphorus = NUTRITION_LACK;
        } else if(phosphorus >= OLD_PHOSPHORUS_MAX){
            nutrition_info.eval_phosphorus = NUTRITION_EXCESS;
        } else {
            nutrition_info.eval_phosphorus = NUTRITION_GOOD;
            nutrition_score++;
        }
    }

    nutrition_info.nutrition_score = nutrition_score;

    return nutrition_info;
};

const nutrition_standard = target_age_id => {

    let nutrition_standard = {};

    switch(target_age_id) {
        case TARGET_AGE_PUPPY:
            nutrition_standard.protein_max = PUPPY_PROTEIN_MAX;
            nutrition_standard.protein_min = PUPPY_PROTEIN_MIN;
            nutrition_standard.fat_max = PUPPY_FAT_MAX;
            nutrition_standard.fat_min = PUPPY_FAT_MIN;
            nutrition_standard.calcium_max = PUPPY_CALCIUM_MAX;
            nutrition_standard.calcium_min = PUPPY_CALCIUM_MIN;
            nutrition_standard.phosphorus_max = PUPPY_PHOSPHORUS_MAX;
            nutrition_standard.phosphorus_min = PUPPY_PHOSPHORUS_MIN;
        break;
        case TARGET_AGE_ADULT:
            nutrition_standard.protein_max = ADULT_PROTEIN_MAX;
            nutrition_standard.protein_min = ADULT_PROTEIN_MIN;
            nutrition_standard.fat_max = ADULT_FAT_MAX;
            nutrition_standard.fat_min = ADULT_FAT_MIN;
            nutrition_standard.calcium_max = ADULT_CALCIUM_MAX;
            nutrition_standard.calcium_min = ADULT_CALCIUM_MIN;
            nutrition_standard.phosphorus_max = ADULT_PHOSPHORUS_MAX;
            nutrition_standard.phosphorus_min = ADULT_PHOSPHORUS_MIN;
        break;
        case TARGET_AGE_OLD:
            nutrition_standard.protein_max = OLD_PROTEIN_MAX;
            nutrition_standard.protein_min = OLD_PROTEIN_MIN;
            nutrition_standard.fat_max = OLD_FAT_MAX;
            nutrition_standard.fat_min = OLD_FAT_MIN;
            nutrition_standard.calcium_max = OLD_CALCIUM_MAX;
            nutrition_standard.calcium_min = OLD_CALCIUM_MIN;
            nutrition_standard.phosphorus_max = OLD_PHOSPHORUS_MAX;
            nutrition_standard.phosphorus_min = OLD_PHOSPHORUS_MIN;
        break;
    }

    return nutrition_standard;
}

module.exports = {
    assess_nutrition,
    nutrition_standard,
    NUTRITION_GOOD,
    NUTRITION_LACK,
    NUTRITION_EXCESS,
}
