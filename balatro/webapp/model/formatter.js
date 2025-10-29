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
                // return "../pictures/Editions/foil2.gif";
                return;
            }
            return "../pictures/Editions/" + sEdition + ".png";
        },

        formatWidth(iWidth, iTotalwidth, iIndex) {
            const iLength = this.getView().byId("HBoxHandCards").getBinding("items").getLength();
            if (iIndex + 1 === iLength) {
                return iWidth + "px";
            } else {
                let iAvailableWidth = iTotalwidth - iWidth;
                iAvailableWidth /= iLength - 1;

                return Math.min(iWidth, iAvailableWidth) + "px";
            }
        },

        formatDeck(sDeckNr) {
            return "../pictures/Decks/" + sDeckNr + ".png";
        },
    };
});
