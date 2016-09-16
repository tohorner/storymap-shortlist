define(["lib-build/tpl!./Popup",
		"lib-build/css!./Popup",
		"lib-build/css!./ColorPickerStyle",
		"lib-build/css!lib-app/spectrum/spectrum",
		"lib-app/spectrum/spectrum",
		"../../../common/builder/media/map/MapConfigOverlay",
		"../../core/WebApplicationData",
		"esri/geometry/Extent",
		"dojo/Deferred",
		"dojo/topic"
	],
	function (
		viewTpl,
		viewCss,
		spectrumCssOverrides,
		spectrumCss,
		spectrum,
		MapConfigOverlay,
		WebApplicationData,
		Extent,
		Deferred,
		topic
	){
		return function Popup(container, builderView)
		{
			container.append(viewTpl({
				btnCancel: i18n.commonCore.common.cancel,
				btnBack: i18n.commonCore.common.back
			}));

			var _popupDeferred = null,
				_cfg = null,
				_btnSubmit = container.find(".btnSubmit"),
				_isTemporaryHide = null,
				_builderView = builderView;

			initEvents();

			this.present = function(cfg)
			{
				_popupDeferred = new Deferred();
				_cfg = cfg;

				app.isAddEditInProgress = true;

				if($('#colorpicker').spectrum())
					$('#colorpicker').spectrum('destroy');
				$('#colorpicker').spectrum({
					color: cfg.entry.color,
					showPalette: true,
					showInput: true,
					palette: ["#425dac", "#b82323", "#37921e", "#874094", "#000000", "#dc6800", "#dab70c", "#A67455"],
					preferredFormat: "hex"
				});

				container.find('.titleContainer input').on({
					change: function() {
						if(!container.find('.titleContainer input').val().length){
							updateSubmitButton(true);
							container.find('.titleContainer input').css('border-color', 'red');
						}else{
							updateSubmitButton(false);
							container.find('.titleContainer input').css('border-color', '#ccc');
						}
					}
				});

				// Title / submit
				if ( cfg.mode == "add" ) {
					container.find('.modal-logo').removeClass("edit");
					container.find('.modal-title').html(
						i18n.builder.addEditPopup.titleAdd
					);
					_btnSubmit.html(i18n.commonCore.common.add);
				}
				else {
					container.find('.modal-logo').addClass("edit");
					container.find('.modal-title').html(
						i18n.builder.addEditPopup.titleEdit
					);
					_btnSubmit.html(i18n.commonCore.common.save);
				}

				// TODO
				container.toggleClass("isAdding", cfg.mode == "add");
				container.toggleClass("isEditing", cfg.mode != "add");

				// Submit
				updateSubmitButton();

				// Title
				container.find('.titleContainer')
					.removeClass('has-feedback has-error')
					.find('.title').val(cfg.mode == "edit" ? cfg.entry.title : "");

				container.modal({keyboard: true});
				return _popupDeferred;
			};

			this.close = function()
			{
				container.modal('hide');
				_popupDeferred.reject();
			};

			function editExtent()
			{
				toggle();
				MapConfigOverlay.present(
					"LOCATION",
					false
				).then(
					function(){
						//_mapConfig.extent = mapConfigResult.extent ? mapConfigResult.extent.toJson() : null;

						//updateStatusConfigureButton();
						//closeConfigureCallback();
						toggle();
						//var tabIndex = $('.entry.active').index();
						//var newExtent = new Extent(mapConfigResult.extent.xmin, mapConfigResult.extent.ymin, mapConfigResult.extent.xmax, mapConfigResult.extent.ymax, mapConfigResult.extent.spatialReference);
						//var newExtent = app.map.extent;

						WebApplicationData.setTabs(app.data.getStory());

						container.find('.webmap-loading').hide();
						container.find('.map-cfg').removeClass("disabled");
					}
				);
			}

			function resetExtent()
			{
				_builderView.updateShortlistExtent();
			}

			function initEvents()
			{
				container.find('.btnCancel').click(function () {
					container.modal('hide');
					//_popupDeferred.reject();
				});

				container.on('shown.bs.modal', function () {
					postDisplay();
				});

				/*container.on('hide.bs.modal', function () {
					_popupDeferred.reject();
				});*/

				$('.tab-cfg-location .btn[data-value="custom"]').click(function(){
					$('.tab-cfg-location .btn[data-value="custom"]').addClass('btn-primary');
					$('.tab-cfg-location .btn[data-value="default"]').removeClass('btn-primary');
					editExtent();
				});

				$('.tab-cfg-location .btn[data-value="default"]').click(function(){
					$('.tab-cfg-location .btn[data-value="default"]').addClass('btn-primary');
					$('.tab-cfg-location .btn[data-value="custom"]').removeClass('btn-primary');
				});

				_btnSubmit.click(onClickSubmit);
			}

			function postDisplay()
			{
				updateSubmitButton();
			}

			function toggle()
			{
				if ( container.hasClass("in") ){
					_isTemporaryHide = true;
					container.addClass("temporaryHide");
				}
				else {
					container.removeClass("temporaryHide");
				}

				container.modal('toggle');
			}

			function onClickSubmit()
			{
				var entryTitle = container.find('.title').val();
				var color = '#' + $('#colorpicker').spectrum('get').toHex();

				var themeIndex = $('.entry.active').index();

				if(color != app.data.getStory()[themeIndex].color){
					$.each(app.layerCurrent.graphics, function(index, graphic){
						app.addFeatureBar.addMapIcon(graphic, color, true);
					});
					var layer = app.map.getLayer(app.data.getShortlistLayerId());
					layer.redraw();
				}

				if($('.tab-cfg-location .btn[data-value="default"]').hasClass('btn-primary'))
					resetExtent();

				app.data.setStory(themeIndex, entryTitle, color);

				app.data.getWebAppData().setTabs(app.data.getStory());

				var colors = {
					header: '#444',
					tabText: '#d8d8d8',
					tab: '#666',
					tabTextActive: '#fff',
					tabActive: color,
					tabTextHover: '#fff',
					tabHover: '#666'
				};
				app.ui.navBar.init(app.data.getStory(), themeIndex, colors, WebApplicationData);

				app.map.getLayer(app.data.getShortlistLayerId()).redraw();
				$('.num').css('background-color', color);
				$('#paneLeft').css('border-top-color', color);
				$('.detailContainer').eq(themeIndex).find('.detailFeatureNum').css('background-color', color);

				topic.publish("BUILDER_INCREMENT_COUNTER", 1);

				app.layerCurrent.color = color;
				container.modal('hide');
			}

			function updateSubmitButton(disableButton)
			{
				_btnSubmit.attr("disabled", disableButton);
			}

			this.initLocalization = function()
			{
				//
			};
		};
	}
);
