angular.module('starter.controllers', [])

.controller('ClassicCtrl', function($scope, Painters, $ionicSideMenuDelegate, pouchService) {

    $scope.picturePreload = function() {
      newPainter = $scope.painters[getRandomIndex($scope.painters.length)];
      newPainterPicture = Math.floor((Math.random() * newPainter.paintings) + 1);
      $scope.picturePreloadUrl = getPicture(newPainter, newPainterPicture);
    };

    $scope.newRound = function() {

      buttonsAreWorking = true;

      currentPainter = newPainter;
      currentPainterPainting = newPainterPicture;
      $scope.picture = $scope.picturePreloadUrl;

      $scope.picturePreload();

      candidates = [];
      candidates.push(currentPainter)

      while (candidates.length < 4) {

        candidate = $scope.painters[getRandomIndex($scope.painters.length)];

        while (candidate == candidates[0] ||
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

    $scope.checkAnswer = function(event) {

      if (buttonsAreWorking) {
        buttonsAreWorking = false;
        if ($(event.target)[0].children[1].innerHTML == $scope.lang.painters[currentPainter.id]) {
          $scope.addAnswer({
            set: $scope.settings.currentSet.id,
            painter: currentPainter.id,
            painting: currentPainterPainting,
            answer: true
          });
          $(event.target).addClass("button-answer-right");
          $scope.answers.push(true);

          switch ($scope.answers.length) {
            case 10:

              soundWin.play();
              $("#win").addClass("animated slideInDown");
              $("#win").css("display", "block");

              setTimeout(function() {
                $("#winDesc").addClass("animated fadeIn");
                $("#winDesc").css("display", "block");
              }, 2000);

              $scope.userStats.wins[$scope.settings.currentSet.id] = $scope.userStats.wins[$scope.settings.currentSet.id] + 1;

              updateDB();

              break;
            default:

              soundRight.play();

              var goodMsg = new PNotify({
                title: "" + goodPhrase() + "<img style='position:absolute; top: 0; right:0; margin: 10px; height: 50px;' src='img/emoji/right" + Math.floor(Math.random() * 10) + ".png'>",
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


              setTimeout(function() {
                $('#picture').addClass('animated fadeOutLeft');
                $scope.$apply();
              }, 1000);


              setTimeout(function() {
                $(event.target).removeClass("button-answer-right");
                $scope.newRound();
                $scope.$apply();
              }, 1500);
          };
        } else {
          $scope.answers.push(false);
          $scope.addAnswer({
            set: $scope.settings.currentSet.id,
            painter: currentPainter.id,
            painting: currentPainterPainting,
            answer: false
          });
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

          soundWrong.play();

          var wrongMsg = new PNotify({
            title: "" + badPhrase(),
            text: $scope.lang.message['wrong-desc'] + " " + $scope.lang.painters[currentPainter.id] + "<img style='position:absolute; top: 0; right:0; margin: 10px; height: 50px;' src='img/emoji/wrong" + Math.floor(Math.random() * 14) + ".png'>",
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

          setTimeout(function() {
            $('#picture').addClass('animated rollOut');
            $scope.$apply();
          }, 2000);


          setTimeout(function() {
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

    var soundWin = new Audio('sounds/winner.wav');
    var soundRight = new Audio('sounds/right2.wav');
    var soundWrong = new Audio('sounds/wrong.wav');

    $scope.getScores = function(num) {
      return new Array(num);
    };

    function goodPhrase() {
      return $scope.lang.goodPhrases[Math.floor((Math.random() * 20) + 1)];
    };

    function badPhrase() {
      //добавть проверку на отключенные ругательства
      return $scope.lang.badPhrases[Math.floor((Math.random() * 12) + 1)];
    };


    //Написать автоматическую переключалку между локал и ремоут картинками
    function getPicture(painter, picture) {
      platform = "http://178.62.133.139/painters/" //"painters/" // "http://178.62.133.139/painters/"
      if (window.innerWidth <= 400) {
        return platform + painter.id + "/thumbnails/" + picture + ".jpg"
          //return "painters/" + painter.id + "/thumbnails/" + picture + ".jpg"
      } else {
        return platform + painter.id + "/" + picture + ".jpg"
          //return "painters/" + painter.id + "/thumbnails/" + picture + ".jpg"
      }
    }

    function shuffle(o) {
      for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    };

    $scope.$watch('settings.currentSet', function(newVal, oldVal) {
      $scope.painters = Painters[$scope.settings.currentSet.id]();
      $scope.picturePreload();
      $scope.newRound();
      $scope.answers = [];
    }, true);

    $scope.openMenu = function() {
      $ionicSideMenuDelegate.toggleLeft();
      // $("#menuIcon").css("color", "white");
    };

    $scope.addAnswer = function(answer) {
      $scope.userStats.answersHistory.push(answer);
      total_answers = $scope.userStats.answersHistory.filter(function(x) {
        return x.set == $scope.settings.currentSet.id
      });
      if (total_answers.length >= 10) {
        right_answers = total_answers.filter(function(x) {
          return x.answer == true
        }).length;
        stats = (right_answers / (total_answers.length / 100)).toFixed(0);
        $scope.userStats.stats[$scope.settings.currentSet.id] = stats;
      }
      updateDB();
    };

    updateDB = function() {
      pouchService.db.get('userStats').then(function(doc) {
        return pouchService.db.put({
          answersHistory: $scope.userStats.answersHistory,
          wins: $scope.userStats.wins,
          stats: $scope.userStats.stats,
          leaderboard: $scope.userStats.leaderboard
        }, 'userStats', doc._rev);
      }).then(function(response) {
        // handle response
      }).catch(function(err) {
        console.log(err);
      });
    }

  }) // controller end

.controller('AppCtrl', function($ionicSideMenuDelegate, $window, $scope, $state, $ionicHistory, $ionicViewSwitcher, $ionicScrollDelegate, $ionicModal, $timeout, Painters, $localstorage, $cordovaOauth, pouchService) {



    window.MY_SCOPE = $scope; // удалить в продакшне
    $scope.sets = [{
        id: "basic"
      }, {
        id: "renaissance"
      }, {
        id: "impressionism"
      }, {
        id: "realism"
      }, {
        id: "french"
      }, {
        id: "russian"
      }
      // {id: "all"}
    ];

    $scope.settings = $localstorage.getObject('settings');

    if (!$scope.settings.langId) {
      $scope.settings.langId = 'en';
      $scope.settings.currentSet = $scope.sets[0];
      $scope.settings.registered = false;
      $scope.settings.disableAbuse = false;
    };

    $scope.$watch('settings', function(newVal, oldVal) {
      $localstorage.setObject('settings', $scope.settings);
    }, true);


    $scope.langUpdate = function() {
      $scope.lang = Painters[$scope.settings.langId]();
    };
    $scope.langUpdate();


    pouchService.db.get('userInfo').then(function(doc) {
      if (doc.dbname) {
        console.log("sync");
        pouchService.db.sync('http://178.62.133.139:5994/' + doc.dbname, {
          live: true,
          retry: true
        }).on('error', console.log.bind(console));
      };

      $scope.userInfo = doc;

      pouchService.db.get('userStats').then(function(doc) {
        $scope.userStats = doc;
      }).catch(function(err) {
        console.log(err)
      });

      pouchService.db.get('userDuels').then(function(doc) {
        $scope.userDuels = doc;
      }).catch(function(err) {
        console.log(err)
      });


    }).catch(function(err) {
      if (err.status = 404) {
        createEmptyDB();
      } else {
        console.log(err)
      }
    });

    function createEmptyDB() {
      console.log("No localDB, creating new one");
      $scope.userInfo = {
        _id: "userInfo",
        name: undefined,
        email: undefined,
        dbname: undefined
      };

      $scope.userStats = {
        _id: "userStats",
        wins: {
          basic: 0,
          renaissance: 0,
          impressionism: 0,
          realism: 0,
          french: 0,
          russian: 0
        },
        stats: {
          basic: 0,
          renaissance: 0,
          impressionism: 0,
          realism: 0,
          french: 0,
          russian: 0
        },
        leaderboard: {
          basic: 0,
          renaissance: 0,
          impressionism: 0,
          realism: 0,
          french: 0,
          russian: 0
        },
        answersHistory: []
      };

      $scope.userDuels = {
        _id: "userDuels",
      };

      pouchService.db.bulkDocs([
        $scope.userInfo,
        $scope.userStats,
        $scope.userDuels
      ]).then(function(result) {
        console.log(result)
          // handle result
      }).catch(function(err) {
        console.log(err);
      });
    }

    // Модуль авторзации
    $scope.loginData = {};
    $scope.registerData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function() {
      $scope.modal.show();
    };

    function isEmail(email) {
      var regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (isNaN(email.substring(0, 1))) {
        return regex.test(email);
      } else {
        return false
      }
    };

    function generatePassword() {
      // var length = 8,
      //   charset = "abcdefghijklnopqrstuvwxyz0123456789", //ABCDEFGHIJKLMNOPQRSTUVWXYZ
      //   retVal = "";
      // for (var i = 0, n = charset.length; i < length; ++i) {
      //   retVal += charset.charAt(Math.floor(Math.random() * n));
      // }
      // return retVal;
      return "superherodancetonight"
    }

    //Регистрация нового пользователя через имя/email
    var usersDB = new PouchDB('http://178.62.133.139:5994/painters');

    usersDB.getSession(function(err, response) {
      if (err) {
        // network error
      } else if (!response.userCtx.name) {
        // nobody's logged in
      } else {
        // console.log(response)
        $scope.settings.registered = true;
        // response.userCtx.name is the current user
      }
    });

    $scope.unlogin = function() {
      usersDB.logout();
      $scope.settings.registered = false;
      pouchService.db.destroy().then(function(response) {
        console.log(response);
        pouchService.db = new PouchDB('localDB');
        createEmptyDB();
        // success
      }).catch(function(err) {
        console.log(err);
      });
      // setTimeout(function () {
      //
      // }, 1000);

      $ionicSideMenuDelegate.toggleLeft();
    }

    $scope.doRegister = function() {
      if (isEmail($scope.registerData.email) && $scope.registerData.username != undefined) {
        $scope.registerData.email = $scope.registerData.email.toLowerCase();
        $scope.registerData.password = generatePassword();
        $scope.registerData.dbName = $scope.registerData.email.replace('@', '-').replace('.', '-');
        $scope.registerData.lang = $scope.settings.langId;

        usersDB.signup($scope.registerData.email, $scope.registerData.password, {
          metadata: {
            userName: $scope.registerData.username,
            dbName: $scope.registerData.dbName,
            lang: $scope.registerData.lang
          }
        }, function(err, response) {
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
            usersDB.login($scope.registerData.email, $scope.registerData.password, function(err, response) {
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
                $scope.settings.registered = true;
                $scope.closeLogin();
              }
            });


            //Создаем бд под нового пользователя на сервере
            jQuery.ajax({
              type: "POST",
              url: "http://178.62.133.139/art_create_ub.php",
              data: {
                'email': $scope.registerData.email,
              }
            }).done(function(response) {


              $scope.userInfo.name = $scope.registerData.username;
              $scope.userInfo.email = $scope.registerData.email;
              $scope.userInfo.dbName = $scope.registerData.dbName;

              //Сохраняем всю его инфу в локальной базе
              pouchService.db.get('userInfo').then(function(doc) {
                return pouchService.db.put({
                  name: $scope.userInfo.name,
                  email: $scope.userInfo.email,
                  dbname: $scope.userInfo.dbName
                }, 'userInfo', doc._rev);
              }).then(function(response) {
                // handle response
              }).catch(function(err) {
                console.log(err);
              });


              // Подключаем сгенеренную базу к нашему юзеру
              pouchService.db.replicate.to('http://178.62.133.139:5994/' + $scope.registerData.dbName, {
                live: true,
                retry: true
              }).on('error', console.log.bind(console));

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
                    'to': [{
                      'email': $scope.registerData.email,
                      'name': $scope.registerData.username,
                      'type': 'to'
                    }],
                    'autotext': 'true',
                    'subject': "Вы успешно зарегистрированы!",
                    'html': $scope.registerData.username + ", спасибо Вам за регистрацию в Art Challenge!<br>\
                      Теперь вы сможете учавствовать в турнире, дуэлях и отслеживать статистику своих ответов в игре.<br>\
                      По любым вопросам пишите нам на info@artchallenge.ru.<br>\
                      Если хотите следить за новостями из мира культуры, то подписывайте на нас в социальных сетях:<br>\
                      ВКонтакте: http://vk.com/art.challenge<br>\
                      Facebook: http://facebook.com/artchallenge.ru<br><br>\
                      Искренне Ваши, команда Art Challenge<br>\
                      Рубен и Анна."
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


    $scope.doLogin = function() {
      //После логина не обновляются показатели статистики
      if (isEmail($scope.loginData.email)) {
        $scope.loginData.password = "superherodancetonight";
        $scope.loginData.email = $scope.loginData.email.toLowerCase();
        usersDB.login($scope.loginData.email, $scope.loginData.password, function(err, response) {
          if (err) {
            if (err.name === 'unauthorized') {
              alert("Ошибка авторизации: Пользователь с таким email не зарегистрирован")
                // name or password incorrect
            } else {
              alert("Ошибка авторизации: Неизвестная ошибка")
                // cosmic rays, a meteor, etc.
            }
          } else {
            // console.log(response);
            alert("Вы успешно вошли!");

            $scope.userInfo.email = $scope.loginData.email;
            $scope.userInfo.dbName = $scope.loginData.email.replace('@', '-').replace('.', '-');

            pouchService.db.replicate.from('http://178.62.133.139:5994/' + $scope.userInfo.dbName, {
              live: true,
              retry: true
            }).on('error', console.log.bind(console));

            $scope.settings.registered = true;

            usersDB.getUser($scope.loginData.email, function(err, response) {
              if (err) {
                if (err.name === 'not_found') {
                  // typo, or you don't have the privileges to see this user
                } else {
                  // some other error
                }
              } else {
                $scope.userInfo.name = response.userName;

                pouchService.db.get('userStats').then(function(doc) {
                  $scope.userStats = doc;
                }).catch(function(err) {
                  console.log(err)
                });

                // response is the user object
              }
            });

            $scope.closeLogin();
          }
        });
      } else {
        alert('Введите ваш email')
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
    }).then(function(modal) {
      $scope.modalPainterShowInfo = modal;
    });

    $scope.showPainterInfoOnHold = function(event) {
      painterid = $(event.target)[0].children[2].innerHTML;
      painters = Painters["all"]();
      painterid = painters[painterid - 1];
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
      window.margin = 0;
      window.margin = (($('#background').height() - 50 - $('#buttons').height()) - $('#picture').height()) / 2;
      if (window.margin < 0) {
        window.margin = 0
      }
      $('#picture').css('margin-top', window.margin + 'px');
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

    getRandomIndex = function(length) {
      return Math.floor(Math.random() * length);
    };

    $scope.hideAnswers = function() {
      if (!$('#buttons').hasClass("fadeOutDown")) {
        // $ionicScrollDelegate.zoomTo(2);
        $('#buttons').addClass('animated fadeOutDown');
        $('#picture').css('width', '100%');

        // $("#help").html($scope.getGenre(currentPainter));
        // $("#help").css('display', 'block');

      } else {
        // $ionicScrollDelegate.zoomTo(1);
        $('#buttons').removeClass('animated fadeOutDown');
        $('#buttons').addClass('animated fadeInUp');
        $('#picture').css('width', 'auto');

        // $("#help").css('display', 'none');
      };
      $scope.calcPictureMargin();
    };

    $scope.changeSet = function(setId) {
      $scope.settings.currentSet = setId;

      $timeout(function() {
        $scope.goToClassic();
      }, 300);
    };

    $scope.goToClassic = function() {
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      // $ionicViewSwitcher.nextDirection('back');
      $state.go('app.classic');
    };

    $scope.reset = function() {
      $window.location.reload(true);
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
