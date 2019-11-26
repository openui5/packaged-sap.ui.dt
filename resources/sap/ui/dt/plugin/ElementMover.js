/*
 * ! UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2019 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides class sap.ui.dt.plugin.ElementMover.
sap.ui.define(['sap/ui/base/ManagedObject', 'sap/ui/dt/ElementUtil', 'sap/ui/dt/OverlayUtil',
		'sap/ui/dt/OverlayRegistry', 'sap/ui/dt/command/CommandFactory'], function(ManagedObject, ElementUtil, OverlayUtil,
		OverlayRegistry, CommandFactory) {
	"use strict";

	/**
	 * Constructor for a new ElementMover.
	 *
	 * @param {string}
	 *          [sId] id for the new object, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new object
	 * @class The ElementMover enables movement of UI5 elements based on aggregation types, which can be used by drag and
	 *        drop or cut and paste behavior.
	 * @author SAP SE
	 * @version 1.44.44
	 * @constructor
	 * @private
	 * @since 1.34
	 * @alias sap.ui.dt.plugin.ElementMover
	 * @experimental Since 1.34. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var ElementMover = ManagedObject.extend("sap.ui.dt.plugin.ElementMover", /** @lends sap.ui.dt.plugin.ElementMover.prototype */
	{
		metadata : {
			// ---- object ----

			// ---- control specific ----
			library : "sap.ui.dt",
			properties : {
				commandFactory : {
					type : "object",
					defaultValue : CommandFactory
				},
				movableTypes : {
					type : "string[]",
					defaultValue : ["sap.ui.core.Element"]
				}
			},
			associations : {},
			events : {
				'elementMoved' : {}
			}
		}
	});

	/**
	 * @private
	 */
	ElementMover.prototype._getMovableTypes = function() {
		return this.getProperty("movableTypes") || [];
	};

	/**
	 * Predicate to compute movability of an type
	 * @public
	 * @return true if type is movable, false otherwise
	 */
	ElementMover.prototype.isMovableType = function(oElement) {
		var aMovableTypes = this._getMovableTypes();

		return aMovableTypes.some(function(sType) {
			return ElementUtil.isInstanceOf(oElement, sType);
		});
	};

	/**
	 * @protected
	 */
	ElementMover.prototype.checkMovable = function(oOverlay) {
		return true;
	};

	/**
	 * returns the moved overlay (only during movements)
	 *
	 * @public
	 * @return {sap.ui.dt.Overlay} overlay which is moved
	 */
	ElementMover.prototype.getMovedOverlay = function() {
		return this._oMovedOverlay;
	};

	/**
	 * set the moved overlay (only during movements)
	 *
	 * @param {sap.ui.dt.Overlay}
	 *          [oMovedOverlay] overlay which is moved
	 * @public
	 */
	ElementMover.prototype.setMovedOverlay = function(oMovedOverlay) {
		if (oMovedOverlay) {
			this._source = OverlayUtil.getParentInformation(oMovedOverlay);
		} else {
			delete this._source;
		}
		this._oMovedOverlay = oMovedOverlay;
	};

	ElementMover.prototype._getSource = function() {
		return this._source;
	};

	/**
	 * @private
	 */
	ElementMover.prototype.activateAllValidTargetZones = function(oDesignTime, sAdditionalStyleClass) {
		this._iterateAllAggregations(oDesignTime, this._activateValidTargetZone.bind(this), sAdditionalStyleClass);
	};

	/**
	 * @private
	 */
	ElementMover.prototype._activateValidTargetZone = function(oAggregationOverlay, sAdditionalStyleClass) {
		if (this.checkTargetZone(oAggregationOverlay)) {
			oAggregationOverlay.setTargetZone(true);
			if (sAdditionalStyleClass) {
				oAggregationOverlay.addStyleClass(sAdditionalStyleClass);
			}
		}
	};

	/**
	 * @protected
	 */
	ElementMover.prototype.checkTargetZone = function(oAggregationOverlay) {
		if (!oAggregationOverlay.$().is(":visible")) {
			return false;
		}
		var oParentElement = oAggregationOverlay.getElementInstance();
		var oMovedElement = this.getMovedOverlay().getElementInstance();
		var sAggregationName = oAggregationOverlay.getAggregationName();

		if (ElementUtil.isValidForAggregation(oParentElement, sAggregationName, oMovedElement)) {
			return true;
		}
	};

	/**
	 * @private
	 */
	ElementMover.prototype._deactivateTargetZone = function(oAggregationOverlay, sAdditionalStyleClass) {
		oAggregationOverlay.setTargetZone(false);
		if (sAdditionalStyleClass) {
			oAggregationOverlay.removeStyleClass(sAdditionalStyleClass);
		}
	};

	/**
	 * @private
	 */
	ElementMover.prototype.activateTargetZonesFor = function(oOverlay, sAdditionalStyleClass) {
		this._iterateOverlayAggregations(oOverlay, this._activateValidTargetZone.bind(this), sAdditionalStyleClass);
	};

	/**
	 * @private
	 */
	ElementMover.prototype.deactivateTargetZonesFor = function(oOverlay, sAdditionalStyleClass) {
		this._iterateOverlayAggregations(oOverlay, this._deactivateTargetZone.bind(this), sAdditionalStyleClass);
	};

	/**
	 * @private
	 */
	ElementMover.prototype.deactivateAllTargetZones = function(oDesignTime, sAdditionalStyleClass) {
		this._iterateAllAggregations(oDesignTime, this._deactivateTargetZone.bind(this), sAdditionalStyleClass);
	};

	/**
	 * @private
	 */
	ElementMover.prototype._iterateAllAggregations = function(oDesignTime, fnStep, sAdditionalStyleClass) {
		var that = this;

		var aOverlays = oDesignTime.getElementOverlays();
		aOverlays.forEach(function(oOverlay) {
			that._iterateOverlayAggregations(oOverlay, fnStep, sAdditionalStyleClass);
		});
	};

	/**
	 * @private
	 */
	ElementMover.prototype._iterateOverlayAggregations = function(oOverlay, fnStep, sAdditionalStyleClass) {
		var aAggregationOverlays = oOverlay.getAggregationOverlays();
		aAggregationOverlays.forEach(function(oAggregationOverlay) {
			fnStep(oAggregationOverlay, sAdditionalStyleClass);
		});
	};

	ElementMover.prototype._isInvalidateSimpleFormEnabled = function(bEnabled, oMovedOverlay) {
		var oFirstHiddenAggregationOverlay = oMovedOverlay.getFirstHiddenAggregationOverlay();
		if (oFirstHiddenAggregationOverlay) {
			var oElementInstance = oFirstHiddenAggregationOverlay.getElementInstance();
			if (oElementInstance.getMetadata().getName() === "sap.ui.layout.form.SimpleForm") {
				// activate/deactivate overwrite of the invalidate function
				oElementInstance._bChangedByMe = !bEnabled;
			}
		}
	};

	/**
	 * @private
	 */
	ElementMover.prototype.repositionOn = function(oMovedOverlay, oTargetElementOverlay) {
		var oMovedElement = oMovedOverlay.getElementInstance();

		var oTargetParent = OverlayUtil.getParentInformation(oTargetElementOverlay);

		if (oTargetParent.index !== -1) {
			this._isInvalidateSimpleFormEnabled(false, oMovedOverlay);
			ElementUtil
					.insertAggregation(oTargetParent.parent, oTargetParent.aggregation, oMovedElement, oTargetParent.index);
			this._isInvalidateSimpleFormEnabled(true, oMovedOverlay);
		}
	};

	/**
	 * @private
	 */
	ElementMover.prototype.insertInto = function(oMovedOverlay, oTargetAggregationOverlay) {
		var oMovedElement = oMovedOverlay.getElementInstance();
		var oTargetParentElement = oTargetAggregationOverlay.getElementInstance();

		var oSourceAggregationOverlay = oMovedOverlay.getParent();
		if (oTargetAggregationOverlay !== oSourceAggregationOverlay) {
			var sTargetAggregationName = oTargetAggregationOverlay.getAggregationName();
			this._isInvalidateSimpleFormEnabled(false, oMovedOverlay);
			ElementUtil.addAggregation(oTargetParentElement, sTargetAggregationName, oMovedElement);
			this._isInvalidateSimpleFormEnabled(true, oMovedOverlay);
		}
	};

	ElementMover.prototype._compareSourceAndTarget = function(oSource, oTarget) {
		var vProperty;
		for (vProperty in oSource) {
			switch (typeof (oSource[vProperty])) {
				case 'object':
					if (oSource[vProperty].getId() !== oTarget[vProperty].getId()) {return false;}
					break;
				default:
					if (oSource[vProperty] !== oTarget[vProperty]) {return false;}
			}
		}

		return true;
	};

	ElementMover.prototype.buildMoveEvent = function() {

		var oMovedOverlay = this.getMovedOverlay();
		var oMovedElement = oMovedOverlay.getElementInstance();
		var oSource = this._getSource();
		var oPublicSourceParent = oSource.publicParent;
		var oSourceParentOverlay = OverlayRegistry.getOverlay(oPublicSourceParent);
		var oTarget = OverlayUtil.getParentInformation(oMovedOverlay);
		var iSourceIndex = oSource.index;
		var iTargetIndex = oTarget.index;

		var bSourceAndTargetAreSame = this._compareSourceAndTarget(oSource, oTarget);

		if (bSourceAndTargetAreSame) {
			return undefined;
		}
		delete oSource.index;
		delete oTarget.index;

		var oMove = this.getCommandFactory().getCommandFor(oPublicSourceParent, "Move", {
			movedElements : [{
				element : oMovedElement,
				sourceIndex : iSourceIndex,
				targetIndex : iTargetIndex
			}],
			source : oSource,
			target : oTarget
		}, oSourceParentOverlay.getDesignTimeMetadata());

		if (oMove) {
			if (oMove.getMetadata().getName() === "sap.ui.dt.command.SimpleFormMove") {
				// in case this is a dt command, perform immediately to show 'livechange'
				oMove.execute();
			}
		} else {
			jQuery.sap.log.error("Invalid move action in design time metadata of " + oSource.parent.getMetadata().getName());
		}
		return oMove;

	};

	/**
	 * TODO: use this algorithm to search beforeHook
	 *
	 * @private
	 */
	ElementMover.prototype._findAfterHook = function(sName, oMovedOverlay, oSource) {
		// TODO : move between two parents
		var oFirstHiddenAggregationOverlay = oMovedOverlay.getFirstHiddenAggregationOverlay();
		var oPublicParentElementOverlay = oMovedOverlay.getPublicParentElementOverlay();
		if (oFirstHiddenAggregationOverlay && oPublicParentElementOverlay) {
			var aggregationName = oFirstHiddenAggregationOverlay.getAggregationName();
			var oAggregation = oPublicParentElementOverlay.getDesignTimeMetadata().getAggregation(aggregationName);
			if (oAggregation) {
				var oAfterHook = oAggregation[sName];
				if (oAfterHook) {
					return {
						method : oAfterHook,
						context : oPublicParentElementOverlay
					};
				}
			}
		}
		return null;
	};

	return ElementMover;
}, /* bExport= */true);
