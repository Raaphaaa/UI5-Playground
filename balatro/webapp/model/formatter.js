sap.ui.define([], function () {
    "use strict";
    return {
        formatEnhancement(sEnhancement) {
            if (sEnhancement == 0) {
                return "../pictures/Enhancements/Blank.png";
            }
            return "../pictures/Enhancements/" + sEnhancement + ".png";
        },

        formatValue(sColor, sValue) {
            return "../pictures/" + sColor + "/" + sValue + ".png";
        },

        formatSeal(sSeal) {
            if (sSeal == 0) {
                return "../pictures/Seals/Blank.png";
            }
            return "../pictures/Seals/" + sSeal + ".png";
        },

        formatEdition(sEdition) {
            if (sEdition == 0) {
                return;
            }
            return "../pictures/Editions/" + sEdition + ".png";
        },

        formatWidth(iWidth, iTotalwidth, iIndex) {
            let oCards = this.getView().byId("HBoxHandCards").getBinding("items");
            if (iIndex + 1 === oCards.iLength) {
                return iWidth + "px";
            } else {
                let iAvailableWidth = iTotalwidth - iWidth;
                iAvailableWidth /= oCards.iLength - 1;

                return Math.min(iWidth, iAvailableWidth) + "px";
            }
        },

        formatDeck(sDeckNr) {
            return "../pictures/Decks/" + sDeckNr + ".png";
        },
    };
});
