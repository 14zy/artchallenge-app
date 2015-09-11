angular.module('starter.controllers', [])

.controller('ClassicCtrl', function ($scope, Painters, $ionicSideMenuDelegate ) {
	
	$scope.picturePreload = function() {
		newPainter = $scope.painters[getRandomIndex($scope.painters.length)];
		newPainterPicture = Math.floor((Math.random() * newPainter.paintings) + 1);
		$scope.picturePreloadUrl = getPicture(newPainter,newPainterPicture);
	}	
	
	$scope.newRound = function () {

		buttonsAreWorking = true;
		
		currentPainter = newPainter;
		currentPainterPainting = newPainterPicture;
		$scope.picture = $scope.picturePreloadUrl;
		
		$scope.picturePreload();

		candidates = [];
		candidates.push(currentPainter)

		while (candidates.length < 4) {
			
			candidate = $scope.painters[getRandomIndex($scope.painters.length)];
			
			while  (candidate == candidates[0] || 
				candidate == candidates[1] || 
				candidate == candidates[2] || 
				candidate == candidates[3]) { 
					candidate = $scope.painters[getRandomIndex($scope.painters.length)];
				};
				candidates.push(candidate);
				candidate = null;
			};

			$scope.candidates = shuffle(candidates);
		};

		$scope.checkAnswer = function (event) {
			
			if (buttonsAreWorking) {
				buttonsAreWorking = false;
				if ($(event.target)[0].children[1].innerHTML == $scope.lang.painters[currentPainter.id]) {
					$scope.answersHistory.answers.push({set: $scope.userInfo.settings.currentSet.id, painter: currentPainter.id, painting: currentPainterPainting, answer: true});
					$(event.target).addClass("button-answer-right");
					$scope.answers.push(true);

					switch ($scope.answers.length) {
					case 10:
						$("#win").addClass("animated slideInDown");
						$("#win").css("display", "block");
			
						setTimeout(function () {
							$("#winDesc").addClass("animated fadeIn");
							$("#winDesc").css("display", "block");
						}, 2000);
						break;
					default:

						var goodMsg = new PNotify({
							title: "" + goodPhrase() + "<img style='position:absolute; top: 0; right:0; margin: 10px; height: 50px;' src='img/ap.png'>",
							text: $scope.lang.message['right-desc'].replace("__count__", $scope.answers.length),
							addclass: "answerRight",
							animation: 'slide',
							hide: true,
							animate_speed: "fast",
							delay: 2000,
							remove: true,
							buttons: {
								closer: false,
								sticker: false
							},
							history: {
								history: true,
								menu: false
							}
						});
						
						goodMsg.get().click(function() {
							goodMsg.remove();
						});
						

						setTimeout(function () {
							$('#picture').addClass('animated fadeOutLeft');
							$scope.$apply();
						}, 1000);

						
						setTimeout(function () {
							$(event.target).removeClass("button-answer-right");
							$scope.newRound();
							$scope.$apply();
						}, 1500);
					};
				} else {
					$scope.answers.push(false);
					$scope.answersHistory.answers.push({set: $scope.userInfo.settings.currentSet.id, painter: currentPainter.id, painting: currentPainterPainting, answer: false});
					$(event.target).addClass("button-answer-wrong");
					
					switch (currentPainter.id) {
					case candidates[0].id:
						rightAnswerBtn = 0
						break
					case candidates[1].id:
						rightAnswerBtn = 1
						break
					case candidates[2].id:
						rightAnswerBtn = 2
						break
					case candidates[3].id:
						rightAnswerBtn = 3
						break
					};
					
					$("#" + rightAnswerBtn).addClass("button-answer-right");
					
					var wrongMsg = new PNotify({
						title: "" + badPhrase(),
						text: $scope.lang.message['wrong-desc'] + " " + $scope.lang.painters[currentPainter.id] + "<img style='position:absolute; top: 0; right:0; margin: 10px; height: 50px;' src='img/stop.png'>",
						addclass: "answerWrong",
						animation: 'slide',
						hide: true,
						animate_speed: "fast",
						delay: 3000,
						remove: true,
						buttons: {
							closer: false,
							sticker: false
						},
						history: {
							history: true,
							menu: false
						}
					});
					
					wrongMsg.get().click(function() {
						wrongMsg.remove();
						$scope.showPainterInfo(currentPainter);
					});
					
					setTimeout(function () {
						$('#picture').addClass('animated rollOut');
						$scope.$apply();
					}, 2000);
					
					
					setTimeout(function () {
						$scope.answers = [];
						$(event.target).removeClass("button-answer-wrong");
						$("#" + rightAnswerBtn).removeClass("button-answer-right");
						rightAnswerBtn = null;
						$scope.newRound();
						$scope.$apply();
					}, 2500);

				}
			}
		};

		//misc			
		
		$scope.getScores = function (num) {
			return new Array(num);
		};	
		
		function goodPhrase() {
			return $scope.lang.goodPhrases[Math.floor((Math.random()*20)+1)];
		};
	
		function badPhrase() {
			//добавть проверку на отключенные ругательства
			return $scope.lang.badPhrases[Math.floor((Math.random()*12)+1)];
		};
		
		function getPicture(painter, picture) {
			if (window.innerWidth <= 400) {
				return "http://178.62.133.139/painters/" + painter.id + "/thumbnails/" + picture + ".jpg"
				//return "painters/" + painter.id + "/thumbnails/" + picture + ".jpg"
			} else {
				return "http://178.62.133.139/painters/" + painter.id + "/" + picture + ".jpg"
				//return "painters/" + painter.id + "/thumbnails/" + picture + ".jpg"

				// return "/Users/just14zy/Dropbox/Public/painters" + painter.id + "/" + picture + ".jpg"
			}
		}
		
		function shuffle(o) {
			for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		};
		
		$scope.$watch('userInfo.settings.currentSet', function(newVal, oldVal) {
			$scope.painters = Painters[$scope.userInfo.settings.currentSet.id]();
			$scope.picturePreload();
			$scope.newRound();
			// $scope.changeStyle();
			$scope.answers = [];
		   }, true);
		   
		//  $scope.$on('change', function(event, setId) {
		//  			$scope.painters = Painters[$scope.userInfo.settings.currentSet.id]();
		//  			$scope.picturePreload();
		//  			$scope.newRound();
		//  			// $scope.changeStyle();
		//  			$scope.answers = [];
		// 	// console.log($scope.painters);
		// });
		
		$scope.openMenu = function() {
			$ionicSideMenuDelegate.toggleLeft();
			// $("#menuIcon").css("color", "white");
		}

	}) // controller end

	.controller('AppCtrl', function ($window, Painters, $scope, $rootScope, $state, $ionicHistory, $ionicViewSwitcher, $ionicScrollDelegate, $ionicModal, $timeout, Painters, $localstorage, $cordovaOauth) {
		
		window.MY_SCOPE = $scope; // удалить в продакшне		
		$scope.sets = [
			{id: "basic",
			style: {
				backgroundColor: "white",
				pictureBorder: "5px solid lightgray",
				buttonAnswerBackgroundColor: "white",
				buttonAnswerTextColor: "black",
				buttonAnswerBorderRadius: ""}},
			{id: "renaissance",
			style: {
				backgroundColor: "lightgray",
				pictureBorder: "5px solid #8B572A",
				buttonAnswerBackgroundColor: "#8B572A",
				buttonAnswerTextColor: "white",
				buttonAnswerBorderRadius: ""}},
			{id: "impressionism",
			style: {
				backgroundColor: "lighgray",
				pictureBorder: "5px solid red",
				buttonAnswerBackgroundColor: "gray",
				buttonAnswerTextColor: "white",
				buttonAnswerBorderRadius: ""}},
			{id: "realism",
			style: {
				backgroundColor: "white",
				pictureBorder: "5px solid lightgray",
				buttonAnswerBackgroundColor: "white",
				buttonAnswerTextColor: "black",
				buttonAnswerBorderRadius: "50%"}},
			{id: "french",
			style: {
				backgroundColor: "white",
				pictureBorder: "5px solid lightgray",
				buttonAnswerBackgroundColor: "white",
				buttonAnswerTextColor: "black",
				buttonAnswerBorderRadius: "50%"}},
			{id: "russian",
			style: {
				backgroundColor: "white",
				pictureBorder: "5px solid lightgray",
				buttonAnswerBackgroundColor: "white",
				buttonAnswerTextColor: "black",
				buttonAnswerBorderRadius: "50%"}}
			// {id: "all"}
		];
		
		$scope.langUpdate = function () {
			$scope.lang = Painters[$scope.userInfo.settings.langId]();
		}	

		/* Схема
			Настройки храню в localStorage и нигде не синхронизирую
			в userInfo храню имя/почту/язык/имя удаленной бд. 
			историю ответов храню в userStats
		*/
		
		var db = new PouchDB('localDB');
		
		db.allDocs({
		  include_docs: true
		  // attachments: true
		}).then(function (result) {
			if (result.total_rows > 0) {
				$scope.userInfo = result['rows'][1]['doc'];
				$scope.userStats = result['rows'][2]['doc'];
				$scope.answersHistory = result['rows'][0]['doc'];
				
				if (result['rows'][1]['doc']['dbName']) {
					db.sync('http://178.62.133.139:5994/' + result['rows'][1]['doc']['dbName'], {live: true, retry: true}).on('error', console.log.bind(console));
				}
				
				$scope.lang = Painters[$scope.userInfo.settings.langId]();
				// $rootScope.$broadcast('change');
				
			} else {
				console.log("empty")
				
				$scope.userInfo = {
					_id: "userInfo",
					name: undefined,
					email: undefined,
					dbName: undefined,
					settings: {
						langId: "ru",
						currentSet: $scope.sets[0],
						abuse: true,
					}
				};

				$scope.userStats = {
					_id: "userStats",
					wins: 0,
					stats: {
						global: 0
					},
					rating: {
						global: 0
					}
				};

				$scope.answersHistory = {
					_id: "answersHistory",
					answers: []
				};
				
				// $scope.answers = [];
				
				$scope.lang = Painters[$scope.userInfo.settings.langId]();
				// $rootScope.$broadcast('change');
				
				db.bulkDocs([
					$scope.userInfo,
					$scope.userStats,
					$scope.answersHistory
				]).then(function (result) {
				  // handle result
				}).catch(function (err) {
				  console.log(err);
				});
			}

		}).catch(function (err) {
			if (err.status == 404) {
				console.log(err);
			}
		});

							// 				   		$scope.$watch('userInfo', function(newVal, oldVal) {
							// console.log($scope.userInfo)
							// db.bulkDocs([
							// 	$scope.userInfo
							// ]).then(function (result) {
							//   // handle result
							//   console.log(result);
							// }).catch(function (err) {
							//   console.log(err);
							// });
							
							// db.get('userInfo').then(function(doc){
							// 	// console.log($scope.userInfo);
							// 	console.log(doc);
							//
							// 	// $scope.userInfo._rev = doc._rev;
							// 	return db.put($scope.userInfo);
							// }).then(function (result) {
							//   // handle result
							//   console.log(result);
							// }).catch(function (err) {
							//   console.log(err);
							// });
							// 				   		}, true);
	

			// Модуль авторзации
			$scope.loginData = {};
			$scope.registerData = {};
			
			// Create the login modal that we will use later
			$ionicModal.fromTemplateUrl('templates/login.html', {
				scope: $scope
			}).then(function (modal) {
				$scope.modal = modal;
			});

			// Triggered in the login modal to close it
			$scope.closeLogin = function () {
				$scope.modal.hide();
			};

			// Open the login modal
			$scope.login = function () {
				$scope.modal.show();
			};

		    function isEmail(email) {
		        var regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
		        return regex.test(email);
		    };
			
			function generatePassword() {
			    var length = 8,
			        charset = "abcdefghijklnopqrstuvwxyz0123456789", //ABCDEFGHIJKLMNOPQRSTUVWXYZ
			        retVal = "";
			    for (var i = 0, n = charset.length; i < length; ++i) {
			        retVal += charset.charAt(Math.floor(Math.random() * n));
			    }
			    return retVal;
			}

			//Регистрация нового пользователя через имя/email
			var usersDB = new PouchDB('http://178.62.133.139:5994/painters');
	
			usersDB.getSession(function (err, response) {
			  if (err) {
			    // network error
			  } else if (!response.userCtx.name) {
			    // nobody's logged in
			  } else {
				  // console.log(response)
				  $scope.userRegistered = true;
			    // response.userCtx.name is the current user
			  }
			});
	
			$scope.unlogin = function () {
				db.destroy();
				usersDB.logout();
				$scope.userRegistered = false;
			}
							
			$scope.doRegister = function () {
				if ( isEmail($scope.registerData.email) && $scope.registerData.username != undefined ) {
					$scope.registerData.password = generatePassword();
					$scope.registerData.dbName = $scope.registerData.email.replace('@','-').replace('.','-');
					$scope.registerData.lang = $scope.userInfo.langId;

					usersDB.signup($scope.registerData.email, $scope.registerData.password, {
					  metadata : {
						userName: $scope.registerData.username,
						dbName: $scope.registerData.dbName,
						lang : $scope.registerData.lang,
						device : "iphone"
					  }
					}, function (err, response) {
						if (err) {
						    if (err.name === 'conflict') {
								alert("Ошибка регистрации: Пользователь с такими email уже существует")
						      // "batman" already exists, choose another username
						    } else if (err.name === 'forbidden') {
								alert("Ошибка регистрации: Запрещенное имя пользователя")
						      // invalid username
						    } else {
								alert("Ошибка регистрации: Сервер не доступен, попробуйте позже")
						      // HTTP error, cosmic rays, etc.
						    }
						  } else {
							  // console.log(response)
							
							  //Логинимся только что зареганым пользователем
							  usersDB.login($scope.registerData.email, $scope.registerData.password, function (err, response) {
					  			  if (err) {
					  			    if (err.name === 'unauthorized') {
										alert("Успешно зарегистрирован, но не получилось залогиниться на сервере, логин и пароль не совпадают")
					  			      // name or password incorrect
					  			    } else {
										alert("Успешно зарегистрирован, но не получилось залогиниться на сервере, неизвестная ошибка")
					  			      // cosmic rays, a meteor, etc.
					  			    }
					  			  } else {
									  // console.log(response)
									  alert("Вы успешно зарегистрированы!");
									  $scope.userRegistered = true;
									  $scope.closeLogin();
					  			  }
					  			});
							

					  //Создаем бд под нового пользователя на сервере
					//Must begin with a letter.
					  jQuery.ajax({
					       type: "POST",
					       url: "http://178.62.133.139/art_create_ub.php",
					       data: {
					         'email': $scope.registerData.email,
					       }
					      }).done(function(response) {
							  
							// Подключаем сгенеренную базу к нашему юзеру
							  db.sync('http://178.62.133.139:5994/' + $scope.registerData.dbName, {live: true, retry: true}).on('error', console.log.bind(console));

  							  //Сохраняем всю его инфу в локальной базе
							  
							  $scope.userInfo.name = $scope.registerData.username,
							  $scope.userInfo.email = $scope.registerData.email,
  							  $scope.userInfo.dbName = $scope.registerData.dbName

							  
		  						// Регистрация успешна
		  						// Отправляем письмо с паролем пользователю	  
		  						  jQuery.ajax({
		  						       type: "POST",
		  						       url: "https://mandrillapp.com/api/1.0/messages/send.json",
		  						       data: {
		  						         'key': 'pyL7NQYaVCP7PkkLq0BnSQ',
		  						         'message': {
		  						           'from_email': 'info@artchallenge.ru',
		  						           'from_name': 'Art Challenge',
		  						           'to': [
		  						               {
		  						                 'email': $scope.registerData.email,
		  						                 'name': $scope.registerData.username,
		  						                 'type': 'to'
		  						               }
		  						             ],
		  						           'autotext': 'true',
		  						           'subject': "Вы успешно зарегистрированы!",
		  						  										'html': "Спасибо за регистрацию! Ваш пароль: " + $scope.registerData.password
		  						         }
		  						       }
		  						      }).done(function(response) {
		  						  		// console.log(response);
		  						      });
					  			// console.log(response);
					      });
								
						  }
					});
				} else {
					alert('Введите имя пользователя и корректный email')
				}
			};
			

			$scope.doLogin = function () {
				if ( isEmail($scope.loginData.email) && $scope.loginData.password != undefined ) {
				  usersDB.login($scope.loginData.email, $scope.loginData.password, function (err, response) {
		  			  if (err) {
		  			    if (err.name === 'unauthorized') {
							alert("Ошибка авторизации: Логин и пароль не совпадают")
		  			      // name or password incorrect
		  			    } else {
							alert("Ошибка авторизации: Неизвестная ошибка")
		  			      // cosmic rays, a meteor, etc.
		  			    }
		  			  } else {
						  // console.log(response)
						  alert("Вы успешно вошли!");
						  $scope.userRegistered = true;
						  // console.log(response);
						  db.sync('http://178.62.133.139:5994/' + $scope.loginData.email.replace('@','-').replace('.','-'), {live: true, retry: true}).on('error', console.log.bind(console));
						  $scope.closeLogin();
		  			  }
		  			});
				} else {
					alert('Введите email и пароль')
				}
			};
			
			
			$scope.doLoginVK = function() {
			        $cordovaOauth.vkontakte("5036047", ["email"]).then(function(result) {
			            console.log(JSON.stringify(result));
			        }, function(error) {
			            console.log(error);
			        });
			};


			$scope.doLoginFB = function() {
			        $cordovaOauth.facebook("263690153811188", ["email"]).then(function(result) {
			            console.log(JSON.stringify(result));
			        }, function(error) {
			            console.log(error);
			        });
			}
			
			/////////////////////////Конец модуля авторизации//////////////////////////////

			

			$ionicModal.fromTemplateUrl('templates/painterShowInfo.html', {
				scope: $scope
			}).then(function (modal) {
				$scope.modalPainterShowInfo = modal;
			});						

			$scope.showPainterInfoOnHold = function(event) {
				painterid = $(event.target)[0].children[2].innerHTML;
				painters = Painters["all"]();
				painterid = painters[painterid-1];
				$scope.showPainterInfo(painterid);
			};
			
			$scope.showPainterInfo = function(painter) {
				$scope.modalPainterShowInfo.show();
				$ionicScrollDelegate.scrollTop(true);
				$scope.infoPainterId = painter.id;
				$scope.infoPainterName = $scope.lang.painters[painter.id];
				$scope.infoPainterGenre = $scope.getGenre(painter);
				$scope.infoPainternationality = $scope.getNation(painter);;
				$scope.infoPainterYears = painter.years;
				$scope.infoPainterBio = painter.bio["ru"]; //$scope.userInfo.langId
				$scope.infoPainterLink = painter.link.wikipedia[$scope.userInfo.langId];
			};
			
			$scope.getGenre = function(painter) {
				genre = undefined;
				painter.genre.forEach(function(entry) {
					if (genre == undefined) {
						genre = $scope.lang.genre[entry]
					} else {
						genre = genre + ', ' + $scope.lang.genre[entry]
					}
				});
				return genre;
			};
			
			$scope.getNation = function(painter) {
				nationality = undefined;
				painter.nationality.forEach(function(entry) {
					if (nationality == undefined) {
						nationality = $scope.lang.nation[entry]
					} else {
						nationality = nationality + ', ' + $scope.lang.nation[entry]
					}
				});
				return nationality;
			};
			
			$scope.calcPictureMargin = function() {
				//добавляем отступ сверху, чтобы картина была по середине
				window.margin = (($('#background').height()- 50 - $('#buttons').height()) - $('#picture').height())/2;
				if (window.margin < 0) {window.margin=0}
				$('#picture').css('margin-top', window.margin+'px');
			};
			
			$scope.imageloaded = function() {
				$('#picture').removeClass('animated rollOut');
				$('#picture').removeClass('animated fadeOutLeft');
				if ($('#picture').css("visibility") == "hidden") {
					$('#picture').css("visibility", "visible");	
					$('#picture').addClass('animated fadeIn');
				} else {
					$('#picture').addClass('animated fadeInRight');
				};
				$scope.calcPictureMargin();
			};
			
			getRandomIndex = function(length){
				return Math.floor(Math.random() * length);
			};
		
			$scope.hideAnswers = function () {
					if (!$('#buttons').hasClass("fadeOutDown")) {
						// $scope.previousDivContent = $("#navigation").html();
						// $ionicScrollDelegate.zoomTo(2);
						$('#buttons').addClass('animated fadeOutDown');
						$('#picture').css('width', '100%');

						$("#help").html($scope.getGenre(currentPainter));
						$("#help").css('display','block');

					} else {
						// $ionicScrollDelegate.zoomTo(1);
						$('#buttons').removeClass('animated fadeOutDown');
						$('#buttons').addClass('animated fadeInUp');
						$('#picture').css('width', 'auto');

						// $("#help").html($scope.getGenre(currentPainter));
						$("#help").css('display','none');
					};
					$scope.calcPictureMargin();
			};
		
			$scope.changeSet = function(setId) {
				$scope.userInfo.settings.currentSet = setId;
				// $rootScope.$broadcast('change', setId);

				$timeout(function () {
					$scope.goToClassic();
				}, 300);
			};

			$scope.reset = function() {
				alert("reset");
				$window.location.reload(true);
			};


			$scope.goToClassic = function() {
			    $ionicHistory.nextViewOptions({
			       disableBack: true
			     });
				// $ionicViewSwitcher.nextDirection('back');
				$state.go('app.classic');
			};
			
		})
		.directive('imageonload', function() {
			return {
				restrict: 'A',
				link: function(scope, element, attrs) {
					element.bind('load', function() {
						//call the function that was passed
						scope.$apply(attrs.imageonload);
					});
				}
			};
		})