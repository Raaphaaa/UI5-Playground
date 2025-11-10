sap.ui.define(
    [
        "balatro/balatro/model/formatter",
        "balatro/balatro/controller/BaseController",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/json/JSONModel",
        "sap/m/Text",
        "sap/m/Label",
        "sap/m/VBox",
        "sap/m/ObjectStatus",
        "sap/ui/core/CustomData",
    ],
    (formatter, BaseController, Filter, FilterOperator, JSONModel, Text, Label, VBox, ObjectStatus, CustomData) => {
        ("use strict");

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

                const oUiTable = this.byId("UiTable");
                oUiTable.attachRowsUpdated(this._highlightRows.bind(this));
                oUiTable.attachCellClick(this.onCellClicked.bind(this));

                this._generateFilterBarFields();
            },

            _highlightRows() {
                // let oUiTable = this.getView().byId("UiTable");
                // const aRows = oUiTable.getRows();
                // const aColumns = oUiTable.getColumns();
                // aRows.forEach((oRow) => {
                //     // Felder aus der aktuellen Zeile (bestehend aus VBox mit 2 Text-Controls)
                //     const aCells = oRow.getCells();
                //     let bRowHighlighted = false;
                //     aCells.forEach((oCell, i) => {
                //         if (oCell instanceof sap.m.VBox) {
                //             const aItems = oCell.getItems();
                //             const oText = aItems[0];
                //             bRowHighlighted = false;
                //             // Felder highlighten
                //             // Stichwort customData + Binding/CSS
                //             const oContext = oRow.getBindingContext("mappedData");
                //             if (oContext.getProperty(`${aColumns[i].getName()}_ERROR`)) {
                //                 oText.addStyleClass("highlightError");
                //                 bRowHighlighted = true;
                //             } else {
                //                 oText.removeStyleClass("highlightError");
                //             }
                //         }
                //     });
                //     if (bRowHighlighted) {
                //         oRow.addStyleClass("orangeBackground");
                //     } else {
                //         oRow.removeStyleClass("orangeBackground");
                //     }
                // });
            },

            onCellClicked(oEvent) {
                const oContext = oEvent.getParameter("rowBindingContext");
                const sPath = oContext.getPath() + "/expanded";
                const oModel = this.getView().getModel("mappedData");

                console.log(oEvent.getParameter("cellControl"));
                oModel.setProperty(sPath, !oModel.getProperty(sPath));
                // Manueller Refresh für die Anpassung der Zeilenhöhe
                const oUiTable = this.getView().byId("UiTable");
                oUiTable.invalidate();
            },

            _generateFilterBarFields() {
                // Filterbar neu aufbauen, Suchfeld beibehalten
                const oFilterBar = this.byId("FilterBar");
                const oSearchField = oFilterBar.removeAllFilterGroupItems()[0];
                oFilterBar.addFilterGroupItem(oSearchField);

                const oView = this.getView();
                const oMappedData = oView.getModel("mappedData").getData();
                const oModel = oView.getModel("data").getData();

                this.tableColumns.forEach(function (sColumnName) {
                    // Beschreibung zum technischen Feldnamen auslesen
                    const sDescr = oModel.find(
                        (item) => item.FIELDNAME === sColumnName && item.FIELD_DESCR
                    )?.FIELD_DESCR;

                    // Alle einzigartigen Feldwerte für das gegebene Feld <sColumnName> finden
                    let aValues = [...new Set(oMappedData.map((d) => d[sColumnName]))];
                    // Umwandlung für JSON-Model
                    let aModelData = aValues.map(function (d) {
                        return { VALUE: d };
                    });
                    let oNewModel = new sap.ui.model.json.JSONModel(aModelData);
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

                    // Filter mit den gegebenen Werten erstellen
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
                const oModel = this.getView().getModel("data").getData();
                const oUiTable = this.getView().byId("UiTable");
                oUiTable.removeAllColumns();

                // einzigartige Spaltennamen filtern
                this.tableColumns = [...new Set(oModel.map((d) => `${d.FIELDNAME}`))];
                this.tableColumns.forEach(function (sColumnName) {
                    // SAP.UI.TABLE.TABLE
                    const sDescr = oModel.find(
                        (item) => item.FIELDNAME === sColumnName && item.FIELD_DESCR
                    )?.FIELD_DESCR;

                    // let oTemplate = new VBox({
                    //     fitContainer: true,
                    //     height: "100%",
                    //     alignItems: "Start",
                    //     justifyContent: "SpaceBetween",
                    // });

                    let oActual = new ObjectStatus({
                        text: `{mappedData>${sColumnName}}`,
                    });

                    oActual.addCustomData(new CustomData({ key: "actualValue", value: `{mappedData>${sColumnName}}` }));
                    oActual.addCustomData(
                        new CustomData({
                            key: "expectedValue",
                            value: `{mappedData>expected/${sColumnName}}`,
                        })
                    );

                    oActual.addEventDelegate({
                        onAfterRendering: function (oEvent) {
                            const oCtrl = oEvent.srcControl;
                            const actual = oCtrl.data("actualValue");
                            const expected = oCtrl.data("expectedValue");
                            if (expected != undefined && (actual || expected)) {
                                oCtrl.setState(actual === expected ? "None" : "Error");
                                let oParent = oCtrl.getParent();
                                oCtrl.addStyleClass("orangeBackground");
                            } else {
                                oCtrl.setState("None");
                            }
                        },
                    });

                    // let oExpected = new Label({
                    //     text: `{mappedData>expected/${sColumnName}}`,
                    //     visible: "{mappedData>expanded}",
                    //     wrapping: true,
                    // });
                    // oTemplate.addItem(oActual);
                    // oTemplate.addItem(oExpected);

                    let oLabel = new Label({ text: sDescr ?? sColumnName });
                    let oNewUiColumn = new sap.ui.table.Column({
                        label: oLabel,
                        template: oActual,
                        sortProperty: `${sColumnName}`,
                        name: `${sColumnName}`,
                    });
                    oUiTable.addColumn(oNewUiColumn);
                }, this);
            },
            _mapTableData() {
                const oModel = this.getView().getModel("data").getData();
                const mappedData = [];

                // 1 Datensatz enthält den Wert für 1 Feld im späteren Model + den erwarteten Wert
                for (const item of oModel) {
                    const actual = item.LINE_ACTUAL - 1;

                    // Zeile existiert noch nicht im neuen Model
                    if (!mappedData[actual]) {
                        // Zeilennummer für Rückwärts-Mapping speichern
                        mappedData[actual] = { LINE_ACTUAL: actual, expanded: false, expected: {} };
                    }
                    // Ziel-Feld und Wert im Model in der Zeile einfügen
                    mappedData[actual][item.FIELDNAME] = item.VALUE_ACTUAL;

                    // Ziel-Feld und erwarteter Wert im Model einfügen
                    mappedData[actual]["expected"][item.FIELDNAME] = item.VALUE_EXPECTED;
                }

                // Soll-/Ist-Vergleich der Feldwerte, Speichern von Differenzen
                for (const item of mappedData) {
                    for (column of this.tableColumns) {
                        item[`${column}_ERROR`] = false;
                        if (item[column] !== item["expected"][column]) {
                            item[`${column}_ERROR`] = true;
                        }
                    }
                }
                let oMappedData = new JSONModel(mappedData);
                this.getView().setModel(oMappedData, "mappedData");
            },

            onSearch: function () {
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
                const oUiTable = this.getView().byId("UiTable");
                oUiTable.getBinding("rows").filter(aFilters);
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
