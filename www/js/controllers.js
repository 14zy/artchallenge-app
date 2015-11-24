angular.module('starter.controllers', [])

.controller('ClassicCtrl', function($scope, Painters, $ionicSideMenuDelegate, pouchService, $ionicModal) {

    $scope.picturePreload = function() {
      newPainter = $scope.painters[getRandomIndex($scope.painters.length)];
      newPainterPicture = Math.floor((Math.random() * newPainter.paintings) + 1);
      $scope.picturePreloadUrl = $scope.getPicture(newPainter, newPainterPicture);
    };

    $scope.newRound = function() {

      buttonsAreWorking = true;

      currentPainter = newPainter;
      currentPainterPainting = newPainterPicture;
      $scope.picture = $scope.picturePreloadUrl;

      //$scope.currentPainter = currentPainter; //подсказка, убрать

      $scope.picturePreload();

      candidates = [];
      candidates.push(currentPainter);

      while (candidates.length < 4) {

        candidate = $scope.painters[getRandomIndex($scope.painters.length)];

        while (candidate == candidates[0] ||
          candidate == candidates[1] ||
          candidate == candidates[2] ||
          candidate == candidates[3]) {
          candidate = $scope.painters[getRandomIndex($scope.painters.length)];
        }
        candidates.push(candidate);
        candidate = null;
      }

      $scope.candidates = shuffle(candidates);
    };

    $scope.checkAnswer = function(event) {

      if (buttonsAreWorking) {
        buttonsAreWorking = false;
        if ($(event.target)[0].children[1].innerHTML == $scope.lang.painters[currentPainter.id]) {
          $(event.target).addClass("button-answer-right");
          $scope.answers.push(true);
          $scope.addAnswer({
            set: $scope.settings.currentSet.id,
            painter: currentPainter.id,
            painting: currentPainterPainting,
            answer: true
          });

          switch ($scope.answers.length) {
            case 2:
              // soundWin.play();
              if ($scope.gameMode == 'classic') {
                $("#win").addClass("animated slideInDown");
                $("#win").css("display", "block");

                setTimeout(function() {
                  $("#winDesc").addClass("animated fadeInUp");
                  $("#winDesc").css("display", "block");
                }, 1000);

                setTimeout(function() {
                  $(event.target).removeClass("button-answer-right");
                }, 1500);

                $scope.userStats.wins[$scope.settings.currentSet.id] = $scope.userStats.wins[$scope.settings.currentSet.id] + 1;
                break;
              }
            default:

              // soundRight.play();

              var goodMsg = new PNotify({
                title: goodPhrase() + "<img style='position:absolute; top: 0; right:0; margin: 10px; height: 50px;' src='img/emoji/right" + Math.floor(Math.random() * 10) + ".png'>",
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
          }
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
              rightAnswerBtn = 0;
              break;
            case candidates[1].id:
              rightAnswerBtn = 1;
              break;
            case candidates[2].id:
              rightAnswerBtn = 2;
              break;
            case candidates[3].id:
              rightAnswerBtn = 3;
              break;
          }

          $("#" + rightAnswerBtn).addClass("button-answer-right");

          // soundWrong.play();

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
        updateDB();
      }
    };

    //misc

    // var soundWin = new Audio('sounds/winner.wav');
    // var soundRight = new Audio('sounds/right2.wav');
    // var soundWrong = new Audio('sounds/wrong.wav');

    $scope.getScores = function(num) {
      return new Array(num);
    };

    function goodPhrase() {
      return $scope.lang.goodPhrases[Math.floor((Math.random() * 20) + 1)];
    }

    function badPhrase() {
      if ($scope.settings.abuse) {
        return $scope.lang.badPhrases[Math.floor((Math.random() * 12) + 1)];
      } else {
        return $scope.lang.message.wrong;
      }
    }


    function shuffle(o) {
      for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }

    $scope.$watch('settings.currentSet', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.painters = Painters[$scope.settings.currentSet.id]();
        $scope.picturePreload();
        $scope.newRound();
        $scope.answers = [];
        $scope.leaderboardMyPlace = false;
      }
    }, true);

    $scope.addAnswer = function(answer) {

      if ($scope.gameMode == 'tournament' && answer.answer === true) {
        if ($scope.userStats.leaderboard[$scope.settings.currentSet.id] < $scope.answers.length) {
          $scope.userStats.leaderboard[$scope.settings.currentSet.id] = $scope.answers.length;
          me = {
            name: $scope.userInfo.name,
            basic: $scope.userStats.leaderboard.basic,
            renaissance: $scope.userStats.leaderboard.renaissance,
            impressionism: $scope.userStats.leaderboard.impressionism,
            realism: $scope.userStats.leaderboard.realism,
            french: $scope.userStats.leaderboard.french,
            russian: $scope.userStats.leaderboard.russian
          };
          $scope.leaderboardDB.get($scope.userInfo.email).then(function(doc) {
            return $scope.leaderboardDB.put(me, $scope.userInfo.email, doc._rev);
          }).then(function(response) {
            console.log(response);
            $scope.leaderboardDB.query('leaderboard/' + $scope.settings.currentSet.id, {
              descending: true,
              limit: 3000
            }).then(function(doc) {
              $scope.leaderboard = doc.rows;
              $scope.getScore();
            }).catch(function(err) {
              console.log(err);
            });
            // handle response
          }).catch(function(err) {
            console.log(err);
            console.log('Пользователя нет в таблице лидеров, регаем его');
            $scope.leaderboardDB.put(me, $scope.userInfo.email).then(function(response) {
              $scope.leaderboardDB.query('leaderboard/' + $scope.settings.currentSet.id, {
                descending: true,
                limit: 3000
              }).then(function(doc) {
                $scope.leaderboard = doc.rows;
                $scope.getScore();
              }).catch(function(err) {
                console.log(err);
              });
            });
          });
        }
      }

      var d = new Date();
      answer.date = d;
      $scope.userStats.answersHistory.push(answer);
      total_answers = $scope.userStats.answersHistory.filter(function(x) {
        return x.set == $scope.settings.currentSet.id;
      });
      if (total_answers.length >= 10) {
        right_answers = total_answers.filter(function(x) {
          return x.answer === true;
        }).length;
        stats = (right_answers / (total_answers.length / 100)).toFixed(0);
        $scope.userStats.stats[$scope.settings.currentSet.id] = stats;
      }
      // updateDB(); не нужно?
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
    };

    $scope.getScore = function() {
      $scope.leaderboardMyPlace = false;
      angular.forEach($scope.leaderboard, function(value, key) {
        if ($scope.userInfo.email == value.id) {
          console.log('Считаем позицию в таблице лидеров: Пользователь уже зареган и присутствует в таблице лидеров');
          $scope.leaderboardMyPlace = key + 1;
        }

        if (!$scope.leaderboardMyPlace && $scope.userStats.leaderboard[$scope.settings.currentSet.id] >= value.key) {
          console.log('Считаем позицию в таблице лидеров: Пользователь не зареган, но его статс круче чем у кого-либо из базы');
          $scope.leaderboardMyPlace = key + 1;
          // key = key + 1;
        }

        // console.log(value.id, value.value, value.key, key); //value.id=email, value.value=name, value.key=score, key=place
      });
    };


    $scope.$watch('gameMode', function(newVal, oldVal) {
      //Добавть проверку, чтобы когда просто дибилы тыкали в меню на одиночную игру у них турнир не сбрасывался
      if (newVal != oldVal && newVal == 'tournament') {
        $scope.newRound();

        $("#win").removeClass("animated slideInDown");
        $("#win").addClass("animated rotateOutUpLeft");
        $("#winDesc").addClass("animated fadeOutDown");
        setTimeout(function() {
          $("#win").css("display", "none");
          $("#winDesc").css("display", "none");
          $("#win").removeClass("animated rotateOutUpLeft");
          $("#winDesc").removeClass("animated fadeOutDown");
        }, 2000);

        $scope.getScore();

      }
    }, true);

    $scope.painters = Painters[$scope.settings.currentSet.id]();
    $scope.picturePreload();
    $scope.newRound();
    $scope.answers = [];


  }) // controller end

.controller('AppCtrl', function($ionicSideMenuDelegate, $ionicLoading, $window, $scope, $state, $ionicHistory, $ionicViewSwitcher, $ionicScrollDelegate, $ionicModal, $timeout, Painters, $localstorage, $cordovaOauth, pouchService, $ionicPopup, $cordovaSocialSharing, $ionicPlatform) {

  $ionicPlatform.registerBackButtonAction(function(event) {
    if ($ionicHistory.currentStateName() == "app.classic") {
      // ionic.Platform.exitApp();
      // or do nothing
    } else {
      $ionicHistory.goBack();
    }
  }, 100);

  $scope.show = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="lines" class="spinner-balanced"></ion-spinner><br>Loading',
      noBackdrop: false
    });
  };


  $scope.hide = function() {
    $ionicLoading.hide();
  };


  $scope.getPicture = function(painter, picture, thumb) {
    $scope.show();
    if ($scope.settings.platformLocal) {
      if (!$scope.settings.highQuality || thumb) {
        return "painters/" + painter.id + "/thumbnails/" + picture + ".jpg";
      } else {
        return "http://178.62.133.139/painters/" + painter.id + "/" + picture + ".jpg";
      }
    } else {
      if (!$scope.settings.highQuality || thumb) {
        return "http://178.62.133.139/painters/" + painter.id + "/thumbnails/" + picture + ".jpg";
      } else {
        return "http://178.62.133.139/painters/" + painter.id + "/" + picture + ".jpg";
      }
    }
  };

  $scope.openMenu = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.gameMode = "classic";
  $scope.changeGameMode = function(mode) {
    if ($scope.settings.registered === false && mode != 'classic') {
      $scope.login();
    } else {
      $scope.gameMode = mode;
    }
  };

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

  $ionicPlatform.ready(function() {
    console.log("deviceready");

    $scope.settings = $localstorage.getObject('settings');
    if (!$scope.settings.langId) {
      //platform local
      // console.log("platform lcoal on");
      // $scope.settings.platformLocal = true;
      // $scope.settings.highQuality = false;

      //platform remote
      console.log("platform remote on");
      $scope.settings.platformLocal = false;
      $scope.settings.highQuality = false;
      if (window.innerWidth >= 500) {
        console.log('hight quality auto on');
        $scope.settings.highQuality = true;
      }

      //always
      var lang = window.navigator.userLanguage || window.navigator.language;
      lang = lang.substring(0, 2).toLowerCase();
      if (lang == "ru" || lang == "en" || lang == "de" || lang == "fr" || lang == "it" || lang == "es") {} else {
        lang = "en";
      }
      $scope.settings.langId = lang;
      $scope.settings.currentSet = $scope.sets[0];
      $scope.settings.registered = false;
      $scope.settings.abuse = true;

      //old style
      // $.ajax({
      //     method: "GET",
      //     url: "painters/1/thumbnails/1.jpg",
      //     async: false
      //   })
      //   .done(function() {
      //     $scope.settings.platformLocal = true;
      //     $scope.settings.highQuality = false;
      //   })
      //   .fail(function() {
      //     $scope.settings.platformLocal = false;
      //     $scope.settings.highQuality = false;
      //     if (window.innerWidth >= 500) {
      //       console.log('hight quality auto on');
      //       $scope.settings.highQuality = true;
      //     }
      //   }).always(function() {
      //
      //     var lang = window.navigator.userLanguage || window.navigator.language;
      //     lang = lang.substring(0, 2).toLowerCase();
      //     if (lang == "ru" || lang == "en" || lang == "de" || lang == "fr" || lang == "it" || lang == "es") {} else {
      //       lang = "en";
      //     }
      //
      //     $scope.settings.langId = lang;
      //     $scope.settings.currentSet = $scope.sets[0];
      //     $scope.settings.registered = false;
      //     $scope.settings.abuse = true;
      //
      //   });
    }

  });

  $scope.$watch('settings', function(newVal, oldVal) {
    $localstorage.setObject('settings', $scope.settings);
  }, true);

  $scope.$watch('settings.langId', function(newVal, oldVal) {
    $scope.lang = Painters[$scope.settings.langId]();
    // console.log("lang");
  }, true);

  pouchService.db.get('userInfo').then(function(doc) {
    if (doc.dbname) {
      syncData(doc.dbname);
    } else {
      copyDataFromDBtoScope();
    }
  }).catch(function(err) {
    if (err.status == 404) {
      console.log(err);
      createEmptyDB();
    } else {
      console.log(err);
    }
  });

  function copyDataFromDBtoScope() {
    pouchService.db.allDocs({
      include_docs: true,
    }).then(function(result) {

      if (result.rows[0].id == "userDuels") {
        $scope.userDuels = result.rows[0].doc;
      } else {
        console.log("Ошибка: не удалось загрузить userDuels из db, result.rows[0] не совпадает с userDuels");
      }

      if (result.rows[1].id == "userInfo") {
        $scope.userInfo = result.rows[1].doc;
      } else {
        console.log("Ошибка: не удалось загрузить userInfo из db, result.rows[1] не совпадает с userInfo");
      }

      if (result.rows[2].id == "userStats") {
        $scope.userStats = result.rows[2].doc;
      } else {
        console.log("Ошибка: не удалось загрузить userStats из db, result.rows[2] не совпадает с userStats");
      }

      if ($scope.userInfo.dbname) {
        pouchService.db.sync('http://178.62.133.139:5994/' + $scope.userInfo.dbname, {
          live: true,
          retry: true
        }).on('complete', function() {
          console.log("не должно выпадать");
        }).catch(function(err) {
          console.log(err);
        });
        console.log('Start live sync');
      }

      console.log("copyDataFromDBtoScope() completed");

    }).catch(function(err) {
      console.log(err);
    });
  }

  function syncData(dbname) {
    pouchService.db.sync('http://178.62.133.139:5994/' + dbname, {}).on('complete', function() {
      copyDataFromDBtoScope();
      console.log("syncData() completed");
    }).catch(function(err) {
      copyDataFromDBtoScope();
      console.log("syncData() not completed, maybe offline");
      console.log(err);
    });
  }

  function createEmptyDB() {

    console.log("No localDB, creating new one");

    pouchService.db.destroy().then(function(response) {
      console.log(response);
      pouchService.db = new PouchDB('localDB');

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
        console.log(result);
        // handle result
      }).catch(function(err) {
        console.log(err);
      });
    }).catch(function(err) {
      console.log(err);
    });
  }


  // LEADERBOARD
  $scope.leaderboardDB = new PouchDB('http://178.62.133.139:5994/leaderboard');

  $scope.leaderboardDB.query('leaderboard/' + $scope.settings.currentSet.id, {
    descending: true,
    limit: 3000
  }).then(function(doc) {
    $scope.leaderboard = doc.rows;
    // console.log($scope.leaderboard);
  }).catch(function(err) {
    $scope.errorOffline = true;
  });

  $ionicModal.fromTemplateUrl('templates/leaderboard.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalTournamtnShowTable = modal;
  });
  //
  // $scope.showTournament = function() {
  //   $scope.modalTournamtnShowTable.show();
  //
  //   angular.forEach($scope.leaderboard, function(value, key) {
  //     console.log(value.id, value.value, value.key, key); //value.id=email, value.value=name, value.key=score, key=place
  //
  //     console.log($scope.userStats.leaderboard[$scope.settings.currentSet.id]);
  //   });
  // };
  $scope.showLeaderboard = function() {
    $scope.leaderboardDB.query('leaderboard/' + $scope.settings.currentSet.id, {
      descending: true,
      limit: 3000
    }).then(function(doc) {
      $scope.leaderboard = doc.rows;
      // console.log($scope.leaderboard);
    }).catch(function(err) {
      $scope.errorOffline = true;
    });
    $scope.modalTournamtnShowTable.show();
  };

  $scope.closeLeaderboard = function() {
    $scope.modalTournamtnShowTable.hide();
  };

  // LEADERBOARD

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
      return false;
    }
  }

  function generatePassword() {
    // var length = 8,
    //   charset = "abcdefghijklnopqrstuvwxyz0123456789", //ABCDEFGHIJKLMNOPQRSTUVWXYZ
    //   retVal = "";
    // for (var i = 0, n = charset.length; i < length; ++i) {
    //   retVal += charset.charAt(Math.floor(Math.random() * n));
    // }
    // return retVal;
    return "superherodancetonight";
  }

  //Регистрация нового пользователя через имя/email
  var usersDB = new PouchDB('http://178.62.133.139:5994/painters');


  ///////////// Логин пользователя - может это вообще нахуй не нужно?? //////////
  // usersDB.getSession(function(err, response) {
  //   if (err) {
  //     // network error
  //   } else if (!response.userCtx.name) {
  //     // nobody's logged in
  //     console.log("Юзер на залогинен, добавить проверку на то есть ли его имя у нас в базе и злогинить его обратно")
  //     console.log($scope.userInfo)
  //   } else {
  //     console.log("Юзер залогинен")
  //     // console.log(response)
  //     $scope.settings.registered = true;
  //     // response.userCtx.name is the current user
  //   }
  // });
  //

  $scope.unlogin = function() {
    usersDB.logout();
    $scope.settings.registered = false;
    createEmptyDB();
    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.doRegister = function() {
    if ($scope.registerData.username !== undefined && isEmail($scope.registerData.email)) {
      $scope.registerData.email = $scope.registerData.email.toLowerCase();
      $scope.registerData.password = generatePassword();
      $scope.registerData.dbname = $scope.registerData.email.replace('@', '-').replace('.', '-');
      $scope.registerData.lang = $scope.settings.langId;

      usersDB.signup($scope.registerData.email, $scope.registerData.password, {
        metadata: {
          userName: $scope.registerData.username,
          dbname: $scope.registerData.dbname,
          lang: $scope.registerData.lang
        }
      }, function(err, response) {
        if (err) {
          if (err.name === 'conflict') {
            $ionicPopup.alert({
              title: $scope.lang.desc.loginMessageErrorDuplicate
            });
            // "batman" already exists, choose another username
          } else if (err.name === 'forbidden') {
            $ionicPopup.alert({
              title: $scope.lang.desc.loginMessageErrorForbiddenName
            });
            // invalid username
          } else {
            $ionicPopup.alert({
              title: $scope.lang.desc.loginMessageErrorServer
            });
            // HTTP error, cosmic rays, etc.
          }
        } else {
          // console.log(response)

          //Логинимся только что зареганым пользователем
          usersDB.login($scope.registerData.email, $scope.registerData.password, function(err, response) {
            if (err) {
              if (err.name === 'unauthorized') {
                alert("Успешно зарегистрирован, но не получилось залогиниться на сервере, логин и пароль не совпадают");
                // name or password incorrect
              } else {
                alert("Успешно зарегистрирован, но не получилось залогиниться на сервере, неизвестная ошибка");
                // cosmic rays, a meteor, etc.
              }
            } else {
              // console.log(response)
              $ionicPopup.alert({
                title: $scope.lang.desc.loginMessageSuccessRegister
              });
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
            $scope.userInfo.dbname = $scope.registerData.dbname;

            //Сохраняем всю его инфу в локальной базе
            pouchService.db.get('userInfo').then(function(doc) {
              return pouchService.db.put({
                name: $scope.userInfo.name,
                email: $scope.userInfo.email,
                dbname: $scope.userInfo.dbname
              }, 'userInfo', doc._rev);
            }).then(function(response) {
              // handle response
            }).catch(function(err) {
              console.log(err);
            });


            // Подключаем сгенеренную базу к нашему юзеру
            pouchService.db.replicate.to('http://178.62.133.139:5994/' + $scope.registerData.dbname, {
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
                  'subject': $scope.lang.desc.loginMessageSuccessRegister,
                  'html': $scope.lang.desc.loginSuccessEmailText.replace('__username__', $scope.registerData.username)
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
      $ionicPopup.alert({
        title: $scope.lang.desc.loginMessageError
      });
    }
  };

  $scope.doLogin = function() {
    if ($scope.loginData.email !== undefined && isEmail($scope.loginData.email)) {
      $scope.loginData.password = "superherodancetonight";
      $scope.loginData.email = $scope.loginData.email.toLowerCase();
      usersDB.login($scope.loginData.email, $scope.loginData.password, function(err, response) {
        if (err) {
          if (err.name === 'unauthorized') {
            alert("Ошибка авторизации: Пользователь с таким email не зарегистрирован");
            // name or password incorrect
          } else {
            alert("Ошибка авторизации: Неизвестная ошибка");
            // cosmic rays, a meteor, etc.
          }
        } else {
          $ionicPopup.alert({
            title: $scope.lang.desc.loginMessageSuccessLogin
          });

          $scope.userInfo.email = $scope.loginData.email;
          $scope.userInfo.dbname = $scope.loginData.email.replace('@', '-').replace('.', '-');

          pouchService.db.replicate.from('http://178.62.133.139:5994/' + $scope.userInfo.dbname).then(function(result) {
            console.log('Скопировали базу из облака, начинаем copyDataFromDBtoScope()');
            copyDataFromDBtoScope();

            $scope.settings.registered = true;
            $scope.closeLogin();
          }).catch(function(err) {
            console.log(err);
          });
        }
      });
    } else {
      $ionicPopup.alert({
        title: $scope.lang.desc.loginMessageErrorEmail
      });
    }
  };

  // $scope.doLoginVK = function() {
  //   $cordovaOauth.vkontakte("5036047", ["email"]).then(function(result) {
  //     console.log(JSON.stringify(result));
  //   }, function(error) {
  //     console.log(error);
  //   });
  // };
  //
  //
  // $scope.doLoginFB = function() {
  //   $cordovaOauth.facebook("263690153811188", ["email"]).then(function(result) {
  //     console.log(JSON.stringify(result));
  //   }, function(error) {
  //     console.log(error);
  //   });
  // };

  /////////////////////////Конец модуля авторизации//////////////////////////////


  $scope.slideHasChanged = function($index) {
    $scope.settings.currentSet = $scope.sets[$index];
    $scope.gameMode = 'classic';
  };

  $scope.activeSlideId = function() {
    return $scope.sets.map(function(e) {
      return e.id;
    }).indexOf($scope.settings.currentSet.id);
  };

  $scope.showPainters = function(set) {
    return Painters[set.id]();
  };

  $ionicModal.fromTemplateUrl('templates/painterShowInfo.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalPainterShowInfo = modal;
  });

  $scope.showPainterInfoOnHold = function(event, scroll) {
    painterid = $(event.target)[0].children[2].innerHTML;
    painters = Painters.all();
    painterid = painters[painterid - 1];
    $scope.showPainterInfo(painterid, scroll);
  };

  $scope.showPainterInfo = function(painter, scroll) {
    $scope.modalPainterShowInfo.show();
    if (scroll) {
      $ionicScrollDelegate.scrollTop(true);
    }
    $scope.infoPainterId = painter.id;
    $scope.infoPainterName = $scope.lang.painters[painter.id];
    $scope.infoPainterGenre = $scope.getGenre(painter);
    $scope.infoPainternationality = $scope.getNation(painter);
    $scope.infoPainterYears = painter.years;

    $scope.infoPainterPaintings = [];
    for (i = 0; i < painter.paintings; i++) {
      $scope.infoPainterPaintings.push($scope.getPicture(painter, i + 1, true));
    }

    if (painter.bio[$scope.settings.langId]) {
      $scope.infoPainterBio = painter.bio[$scope.settings.langId];
    } else {
      $scope.infoPainterBio = painter.bio.en;
    }

    if (painter.link.wikipedia[$scope.settings.langId]) {
      $scope.infoPainterLink = painter.link.wikipedia[$scope.settings.langId];
    } else {
      $scope.infoPainterLink = painter.link.wikipedia.en;
    }

  };

  $scope.getGenre = function(painter) {
    genre = undefined;
    painter.genre.forEach(function(entry) {
      if (genre === undefined) {
        genre = $scope.lang.genre[entry];
      } else {
        genre = genre + ', ' + $scope.lang.genre[entry];
      }
    });
    return genre;
  };

  $scope.getNation = function(painter) {
    nationality = undefined;
    painter.nationality.forEach(function(entry) {
      if (nationality === undefined) {
        nationality = $scope.lang.nation[entry];
      } else {
        nationality = nationality + ', ' + $scope.lang.nation[entry];
      }
    });
    return nationality;
  };

  $scope.calcPictureMargin = function() {
    //добавляем отступ сверху, чтобы картина была по середине
    window.margin = 0;
    if (window.innerWidth <= 400) {
      window.margin = (($('.background').height() - $('#navigation').height() - $('#buttons').height()) - $('#picture').height()) / 2;
    } else {
      window.margin = ($('.background').height() - ($('#navigation').height()) - $('#buttons').height() - $('#picture').height()) / 2;
    }

    if (window.margin < 0) {
      window.margin = 0;
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
    }
    $scope.calcPictureMargin();
    $scope.hide();
  };

  getRandomIndex = function(length) {
    return Math.floor(Math.random() * length);
  };

  $scope.hideAnswers = function() {
    if (!$('#buttons').hasClass("fadeOutDown")) {
      // $ionicScrollDelegate.zoomTo(2);
      $('#buttons').addClass('animated fadeOutDown');
      $('#picture').css('width', '100%');
      $('#picture').css('max-height', 'none');
      // $("#help").html($scope.getGenre(currentPainter));
      // $("#help").css('display', 'block');

    } else {
      // $ionicScrollDelegate.zoomTo(1);
      $('#buttons').removeClass('animated fadeOutDown');
      $('#buttons').addClass('animated fadeInUp');
      $('#picture').css('width', 'auto');
      $('#picture').css('max-height', '80%');
      // $("#help").css('display', 'none');
    }
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
    $ionicViewSwitcher.nextDirection('back');
    $state.go('app.classic');
  };

  $scope.reset = function() { //можно убрать
    $window.location.reload(true);
  };

  $scope.showShare = function() {
    $("#btnShowShare").html("<i class='ion-load-a'></i>");
    $cordovaSocialSharing
      .share($scope.lang.shares.title + " " + $scope.lang.shares.description, $scope.lang.shares.caption, "http://artchallenge.ru/pics/badges/" + $scope.settings.currentSet.id+ "Set/winner-badge-" + $scope.settings.langId+ "-shareFB.png", "http://artchallenge.ru") // Share via native share sheet
      .then(function(result) {
        // Success!
        $("#btnShowShare").html("<i class='icon ion-checkmark-round'></i> " + $scope.lang.message.shareWithFriends);
        // $("#btnShowShare").removeClass("button-positive");
        // $("#btnShowShare").addClass("button-balanced");
        $("#btnShowShare").addClass("disabled");
      }, function(err) {
        alert("Произошла ошибка :(");
        // An error occured. Show a message to the user
      });
  };

})

.controller('StatsCtrl', function($scope, $state, Painters, $localstorage, pouchService, $ionicSideMenuDelegate, $window) {

    pouchService.db.get('userStats').then(function(doc) {
      answersHistory = doc.answersHistory;
      userStats = doc.stats;
    }).then(function(response) {
      calculateStats();
      // handle response
    }).catch(function(err) {
      console.log(err);
    });

    function calculateStats() {
      answersCurrentSet = answersHistory.filter(function(x) {
        return x.set == $scope.settings.currentSet.id;
      });
      $scope.statGlobalDays = [];
      angular.forEach(answersCurrentSet, function(value, key) {
        var n = new Date(value.date).getDate();
        n = n + "." + (new Date(value.date).getMonth() + 1);
        if ($scope.statGlobalDays[n]) {
          $scope.statGlobalDays[n].push(value.answer);
        } else {
          $scope.statGlobalDays[n] = [];
          $scope.statGlobalDays[n].push(value.answer);
        }
      });

      $scope.days = Object.keys($scope.statGlobalDays).sort().slice(0, 15);
      dataRightAnswersPercent = [];
      dataRightAnswers = [];
      dataWrongAnswers = [];

      angular.forEach($scope.days, function(valueDay, key) {

        trueValues = $scope.statGlobalDays[valueDay].filter(function(x) {
          return x === true;
        });

        dataRightAnswersPercent.push((trueValues.length / ($scope.statGlobalDays[valueDay].length / 100)).toFixed(0));
        dataRightAnswers.push(trueValues.length);
        dataWrongAnswers.push($scope.statGlobalDays[valueDay].length - trueValues.length);
      });

      $scope.statGlobal = {
        labels: $scope.days,
        datasets: [{
          fillColor: "#7ED321",
          strokeColor: "#7ED321",
          data: dataRightAnswers
        }, {
          fillColor: "#D0021B",
          strokeColor: "#D0021B",
          data: dataWrongAnswers
        }],
      };

      $scope.statSets = {
        labels: [$scope.lang.sets.basicSet, $scope.lang.sets.renaissanceSet, $scope.lang.sets.impressionismSet, $scope.lang.sets.realismSet, $scope.lang.sets.frenchSet, $scope.lang.sets.russianSet],
        datasets: [{
          fillColor: "#f1c40f",
          strokeColor: "#f1c40f",
          pointColor: "rgba(151,187,205,0)",
          pointStrokeColor: "#f1c40f",
          data: [userStats.basic, userStats.renaissance, userStats.impressionism, userStats.realism, userStats.french, userStats.russian]
        }],
      };
    } // calculateStats end

    // $scope.openMenu = function() {
    //   $ionicSideMenuDelegate.toggleLeft();
    // };

  }) // controller end

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
});
