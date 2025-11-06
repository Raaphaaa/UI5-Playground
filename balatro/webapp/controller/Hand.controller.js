sap.ui.define(
    [
        "balatro/balatro/model/formatter",
        "balatro/balatro/controller/BaseController",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/ui/model/json/JSONModel",
        "sap/ui/table/Column",
        "sap/m/table/columnmenu/Menu",
        "sap/m/Label",
        "sap/m/Text",
        "sap/m/ObjectStatus",
    ],
    (
        formatter,
        BaseController,
        Filter,
        FilterOperator,
        Sorter,
        JSONModel,
        Column,
        ColumnHeader,
        Label,
        Text,
        ObjectStatus
    ) => {
        "use strict";

        return BaseController.extend("balatro.balatro.controller.Hand", {
            formatter: formatter,
            onInit() {
                BaseController.prototype.onInit.apply(this, arguments);

                this.getRouter().getRoute("HandCards").attachMatched(this._onRouteMatched, this);
            },

            _onRouteMatched(oEvent) {
                let oArgs = oEvent.getParameter("arguments");
                let oView = this.getView();

                this.oKey = this.oModel.createKey("/Game", {
                    GameId: oArgs.GameId,
                });

                oView.bindElement({
                    path: this.oKey,
                    parameters: {
                        expand: "to_Cards",
                    },
                });

                // vorher noch Daten aus Backend auslesen mit TC_ID, PROTOCOL_ID usw.
                this._generateTableColumns();
                this._mapTableData();
                this._generateFilterBarFields();
            },

            _generateFilterBarFields() {
                const oFilterBar = this.byId("FilterBar");
                const oView = this.getView();
                oFilterBar.addFilterGroupItem(oFilterBar.removeAllFilterGroupItems()[0]);

                const oMappedData = oView.getModel("mappedData").getData();
                const oModel = oView.getModel("data").getData();

                this.tableColumns.forEach(function (sColumnName) {
                    // Beschreibung zum technischen Feldnamen auslesen
                    const sDescr = oModel.find(
                        (item) => item.FIELDNAME === sColumnName && item.FIELD_DESCR
                    )?.FIELD_DESCR;

                    let aUniqueValues = [...new Set(oMappedData.map((d) => d[sColumnName]))].map(function (d) {
                        return { VALUE: d };
                    });
                    let oNewModel = new sap.ui.model.json.JSONModel(aUniqueValues);
                    oView.setModel(oNewModel, `_FILTER_${sColumnName}`);

                    const oItemTemplate = new sap.ui.core.Item({
                        key: `{_FILTER_${sColumnName}>VALUE}`,
                        text: `{_FILTER_${sColumnName}>VALUE}`,
                    });
                    let oMultiComboBox = new sap.m.MultiComboBox({
                        name: `${sColumnName}`,
                        items: {
                            path: `_FILTER_${sColumnName}>/`,
                            template: oItemTemplate,
                        },
                    });
                    let oCustomFilter = new sap.ui.comp.filterbar.FilterGroupItem({
                        groupName: "StrukturierteAnsicht",
                        name: `${sColumnName}`,
                        label: sDescr,
                        visibleInFilterBar: true,
                        control: oMultiComboBox,
                    });
                    oFilterBar.addFilterGroupItem(oCustomFilter);
                });
            },
            _generateTableColumns() {
                // this.getView().byId("TreeTable").removeAllColumns();
                this.getView().byId("Table").removeAllColumns();

                const oModel = this.getView().getModel("data").oData;

                // einzigartige Spaltennamen filtern
                this.tableColumns = [...new Set(oModel.map((d) => `${d.FIELDNAME}`))];

                this.tableColumns.forEach(function (sColumnName) {
                    // Beschreibung zum technischen Feldnamen auslesen
                    const sDescr = oModel.find(
                        (item) => item.FIELDNAME === sColumnName && item.FIELD_DESCR
                    )?.FIELD_DESCR;

                    // Label als Column Header
                    let oLabel = new Label({ text: sDescr ?? sColumnName });

                    const oTable = this.getView().byId("Table");
                    oTable.addColumn(
                        new sap.m.Column({
                            header: oLabel,
                        })
                    );
                }, this);
            },

            _mapTableData() {
                const oModel = this.getView().getModel("data").oData;
                const grouped = [];

                // 1 Datensatz enthält den Wert für 1 Feld im späteren Model + den erwarteten Wert
                for (const item of oModel) {
                    const actual = item.LINE_ACTUAL - 1;

                    // Zeile existiert noch nicht im neuen Model --> neue Zeile mit Zeilennummer erstellen für Rückwärts-Mapping
                    if (!grouped[actual]) {
                        grouped[actual] = { LINE_ACTUAL: actual, expanded: false, expected: {} };
                    }
                    // Ziel-Feld und Wert im Model in der Zeile einfügen
                    grouped[actual][item.FIELDNAME] = item.VALUE_ACTUAL;

                    // Ziel-Feld und erwarteter Wert im Model in der "Erwartete-Werte-Struktur" einfügen
                    grouped[actual]["expected"][item.FIELDNAME] = item.VALUE_EXPECTED;
                }

                let oMappedData = new JSONModel(grouped);
                this.getView().setModel(oMappedData, "mappedData");
            },

            onSearch: function () {
                let oTable = this.getView().byId("Table");
                let oFilterBar = this.getView().byId("FilterBar");

                let that = this;
                let aFilters = oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                    let oControl = oFilterGroupItem.getControl();
                    let aSelectedKeys = {};
                    let aFilters = [];
                    // MultiComboBox
                    if (oControl.getSelectedKeys) {
                        aSelectedKeys = oControl.getSelectedKeys();
                        aFilters = aSelectedKeys.map(function (sSelectedKey) {
                            return new Filter({
                                path: oFilterGroupItem.getName(),
                                operator: FilterOperator.Contains,
                                value1: sSelectedKey,
                            });
                        });
                    }
                    // Search Field
                    else if (oControl.getValue().trim()) {
                        aSelectedKeys = oControl.getValue().trim();
                        that.tableColumns.forEach(function (sColumnName) {
                            aFilters.push(
                                new Filter({
                                    path: sColumnName,
                                    operator: FilterOperator.Contains,
                                    value1: aSelectedKeys,
                                })
                            );
                        });
                    }
                    if (aSelectedKeys.length > 0) {
                        aResult.push(
                            new Filter({
                                filters: aFilters,
                                and: false,
                            })
                        );
                    }
                    return aResult;
                }, []);
                oTable.getBinding("items").filter(aFilters);
                oTable.setShowOverlay(false);
            },

            createTableItem(sId, oContext) {
                let oColumnListItem = new sap.m.ColumnListItem({
                    type: "Active",
                    press: (oEvent) => {
                        const oItemContext = oEvent.getSource().getBindingContext("mappedData");
                        const bCurrent = oItemContext.getProperty("expanded");
                        oItemContext.getModel().setProperty(oItemContext.getPath() + "/expanded", !bCurrent);
                    },
                });

                let bWarning = false;
                this.tableColumns.forEach(function (ColumnName) {
                    let oVBox = new sap.m.VBox({
                        fitContainer: true,
                        alignItems: "Stretch",
                    });

                    let oNewCell = new sap.m.Text({
                        text: oContext.getProperty(`${ColumnName}`),
                    });
                    oNewCell.addStyleClass("roundCorners");
                    oVBox.addItem(oNewCell);

                    const sExpected = oContext.getProperty(`expected/${ColumnName}`);
                    const sActual = oContext.getProperty(`${ColumnName}`);
                    // let isVisible = oContext.getProperty("expanded");
                    if (sActual !== sExpected && sExpected) {
                        oNewCell.addStyleClass("italicText");
                        // isVisible = true;
                        bWarning = true;
                    }
                    let oExpectedCell = new sap.m.Label({
                        text: oContext.getProperty(`expected/${ColumnName}`),
                        visible: oContext.getProperty("expanded"),
                        wrapping: true,
                    });
                    oVBox.addItem(oExpectedCell);
                    oColumnListItem.addCell(oVBox);
                });
                if (bWarning) {
                    oColumnListItem.addStyleClass("orangeBackground");
                }
                return oColumnListItem;
            },

            onSelectCard(oEvent) {
                let oCard = oEvent.getSource().getBindingContext();
                this.oModel.setProperty(
                    oCard.getPath() + "/IsSelected",
                    !this.oModel.getProperty(oCard.getPath() + "/IsSelected")
                );
            },

            onDrop(oEvent) {
                // swap the 2 cards that were dragged/dropped
                let oDragged = oEvent.getParameter("draggedControl").getBindingContext().getPath();
                let oDropped = oEvent.getParameter("droppedControl").getBindingContext().getPath();

                let pos1 = this.oModel.getProperty(oDragged + "/DisplayPos");
                let pos2 = this.oModel.getProperty(oDropped + "/DisplayPos");

                this.oModel.setProperty(oDragged + "/DisplayPos", pos2);
                this.oModel.setProperty(oDropped + "/DisplayPos", pos1);

                this._sortCards();
                this.getView().getModel("Settings").setProperty("/currentlySortedBy", null);
            },

            _sortCards() {
                const oBinding = this.byId("HBoxHandCards").getBinding("items");
                oBinding.sort([new sap.ui.model.Sorter({ path: "DisplayPos", descending: true })]);
            },

            sortByColor() {
                let aCards = this._getAllCards().sort(function (a, b) {
                    // different colored cards
                    if (a.data.Color < b.data.Color) return -1;
                    if (a.data.Color > b.data.Color) return 1;

                    // same color --> sort by Value
                    return a.data.Value - b.data.Value;
                });

                aCards.forEach(
                    function (card, index) {
                        this.oModel.setProperty(card.path + "/DisplayPos", index + 1);
                    }.bind(this),
                    this
                );

                this._sortCards();
                this.getView().getModel("Settings").setProperty("/currentlySortedBy", "Color");
            },

            sortByValue() {
                let aCards = this._getAllCards().sort(function (a, b) {
                    // different values
                    if (a.data.Value < b.data.Value) return -1;
                    if (a.data.Value > b.data.Value) return 1;

                    if (a.data.Color < b.data.Color) return -1;
                    if (a.data.Color > b.data.Color) return 1;
                });

                aCards.forEach(
                    function (card, index) {
                        this.oModel.setProperty(card.path + "/DisplayPos", index + 1);
                    }.bind(this),
                    this
                );

                this._sortCards();
                this.getView().getModel("Settings").setProperty("/currentlySortedBy", "Value");
            },

            onDrawCard() {
                let oBinding = this.getView().getElementBinding().oElementContext;
                let oParams = { GameId: oBinding.getProperty("GameId"), amount: 1 };

                this.oModel.callFunction("/drawCards", {
                    method: "POST",
                    urlParameters: oParams,
                    etag: this.oModel.getETag(null, oBinding),
                    success: function () {
                        this.oModel.read(this.oKey + "/to_Cards", {
                            success: function (oData) {
                                // switch (this.getView().getModel("Settings").getProperty("/currentlySortedBy")) {
                                //     case "Color":
                                //         this.sortByColor();
                                //         break;
                                //     case "Value":
                                //         this.sortByValue();
                                //         break;
                                //     default:
                                //         let aCards = this._getAllCards();
                                //         aCards.forEach(function (card, index) {
                                //             this.oModel.setProperty(card.path + "/DisplayPos", index + 1);
                                //         }, this);
                                //         this._sortCards();
                                // }
                            }.bind(this),
                        });
                    }.bind(this),
                });
            },

            onDiscardCards() {
                let oBinding = this.getView().getElementBinding().oElementContext;
                let oParams = { GameId: oBinding.getProperty("GameId") };
                this.oModel.callFunction("/discardCards", {
                    method: "POST",
                    urlParameters: oParams,
                    etag: this.oModel.getETag(null, oBinding),
                    success: function () {
                        this.oModel.read(this.oKey + "/to_Cards", {
                            success: function (oData) {}.bind(this),
                        });
                    }.bind(this),
                });
            },

            _getAllCards() {
                let oBinding = this.getView().byId("HBoxHandCards").getBinding("items");
                if (!oBinding) {
                    sap.m.MessageToast.show("Keine Items gefunden");
                    return;
                }

                // collect all contexts
                let aContexts = oBinding.getContexts();
                if (!aContexts || aContexts.length === 0) {
                    sap.m.MessageToast.show("Keine Karten zum Sortieren gefunden");
                    return;
                }

                return aContexts.map(function (oContext) {
                    return {
                        context: oContext,
                        data: oContext.getObject(),
                        path: oContext.getPath(),
                    };
                });
            },
        });
    }
);
