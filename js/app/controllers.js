(function() {
  'use strict';

  angular.module('njApp.controllers', [])
    .controller('NjTreeCtrl', ['$scope', function($scope) {
      $scope.Utils = {
        keys: Object.keys
      }
      // Returns distance matrix in d3 compatible hierarchy data format
      $scope.dataSteps = [];
      $scope.dSteps = [];
      $scope.qSteps = [];
      $scope.msgSteps = [];

      $scope.step = 0;
      var parseD = function(d) {
        var data = {
          "name": "",
          "children": []
        };
        for (var t in d) {
          data.children.push({"name": t});
        }
        return data;
      }

      $scope.D = {
        "a": {
          "a": 0,
          "b": 5,
          "c": 9,
          "d": 9,
          "e": 8
        },
        "b": {
          "a": 5,
          "b": 0,
          "c": 10,
          "d": 10,
          "e": 9
        },
        "c": {
          "a": 9,
          "b": 10,
          "c": 0,
          "d": 8,
          "e": 7,
        },
        "d": {
          "a": 9,
          "b": 10,
          "c": 8,
          "d": 0,
          "e": 3
        },
        "e": {
          "a": 8,
          "b": 9,
          "c": 7,
          "d": 3,
          "e": 0
        }
      };
      $scope.dSteps[0] = JSON.parse(JSON.stringify($scope.D));

      $scope.data = parseD($scope.D);
      console.log(JSON.stringify($scope.data));

      $scope.copyData = JSON.parse(JSON.stringify($scope.data));
      $scope.dataSteps[0] = JSON.parse(JSON.stringify($scope.copyData));

      var sumRow = function(row) {
        var sum = 0;
        for (var v in row) {
          sum += row[v];
        }
        return sum;
      }

      // Returns Q matrix of input distance matrix
      var calculateQ = function(d) {
        var Q = {};
        var n = Object.keys(d).length;
        var taxa = Object.keys(d);
        taxa.forEach(function(i) {
          Q[i] = {};
          taxa.forEach(function(j) {
            if (i != j) {
              Q[i][j] = (n - 2 ) * d[i][j] - sumRow(d[i]) - sumRow(d[j]);
            } else {
              Q[i][j] = "";
            }
          });
        });
        return Q;
      }

      // Returns {"i", "j", "val"} for which Q[i][j] has lowest value
      var minQ = function(q) {
        var minVal = Number.POSITIVE_INFINITY;
        var minKeys = {};
        var taxa = Object.keys(q);
        taxa.forEach(function(i) {
          taxa.forEach(function(j) {
            if (i != j) {
              if (q[i][j] < minVal) {
                minKeys["i"] = i;
                minKeys["j"] = j;
                minVal = q[i][j];
              }
            }
          });
        });
        minKeys["minVal"] = minVal;
        return minKeys;
      }

      $scope.Q = calculateQ($scope.D);
      $scope.qSteps[0] = JSON.parse(JSON.stringify($scope.Q));

      $scope.msgSteps[0] = "We begin neighbor-joining with a star tree and run the algorithm iteratively until the tree is resolved.";


      // Returns node information (object) including children
      var getNodeInfo = function(name, dist, data) {
        var obj = {
          "name": name,
          "dist": dist
        };
        var children = data.children;
        for (var i = 0; i < children.length; i++) {
          if (children[i].name == name && "children" in children[i]) {
            obj["children"] = children[i].children;
          }
        }
        return obj;
      }

      $scope.nextStep = function() {
        if ($scope.data.children.length == 2) {
          $scope.done = true;
          return;
        }
        $scope.step += 1;

        if (typeof $scope.dataSteps[$scope.step] != 'undefined') {
          $scope.data = $scope.dataSteps[$scope.step];
          return;
        }
        var n = Object.keys($scope.D).length;
        var lastNodeDist = "";
        var minKeys = minQ($scope.Q);
        var i = minKeys["i"],
            j = minKeys["j"],
            minVal = minKeys["minVal"];
        var newChildName = i + "-" + j;
        var dI = ($scope.D[i][j] / 2) + (sumRow($scope.D[i]) - sumRow($scope.D[j])) / (2 * (n - 2));
        var dJ = $scope.D[i][j] - dI;
        var updateMsg = "Nodes " + i + " and " + j + " have the minimum Q value of " + minVal + ", so we join " + i + " and " + j + " together as " + newChildName;
        var newChild = {
          "name": newChildName,
          "children": [
            getNodeInfo(i, dI, $scope.copyData),
            getNodeInfo(j, dJ, $scope.copyData)
          ]
        };
        var newChildren = JSON.parse(JSON.stringify($scope.copyData.children));
        // Remove child nodes and add newChild
        newChildren = newChildren.filter(function(item) {
          return !(item.name == i || item.name == j);
        })
        newChildren.push(newChild);
        $scope.copyData.children = newChildren;
        // Update D matrix
        $scope.D[newChildName] = {};
        // Add new row for newChild
        Object.keys($scope.D).forEach(function(taxa) {
          if (taxa != newChildName) {
            var newDist = ($scope.D[i][taxa] + $scope.D[j][taxa] - $scope.D[i][j]) / 2;
            $scope.D[newChildName][taxa] = newDist;
            $scope.D[taxa][newChildName] = newDist;
            lastNodeDist = newDist;
          } else {
            $scope.D[taxa][taxa] = 0;
          }
        });
        // Clear out data corresponding to joined neighbors
        delete $scope.D[i];
        delete $scope.D[j];
        Object.keys($scope.D).forEach(function(taxa) {
          delete $scope.D[taxa][i];
          delete $scope.D[taxa][j];
        });
        $scope.Q = calculateQ($scope.D);
        // If no more joining left, label remaining 2 children of psuedoroot
        if ($scope.copyData.children.length == 2) {
          $scope.copyData.children.forEach(function(child) {
            child["dist"] = lastNodeDist / 2;
          });
        }
        $scope.data = JSON.parse(JSON.stringify($scope.copyData));
        console.log(JSON.stringify($scope.data));
        if ($scope.data.children.length == 2) {
          $scope.done = true;
          updateMsg += ", and we're done!";
        }

        // Store step data

        $scope.dataSteps[$scope.step] = JSON.parse(JSON.stringify($scope.copyData));
        $scope.dSteps[$scope.step] = JSON.parse(JSON.stringify($scope.D));
        $scope.qSteps[$scope.step] = JSON.parse(JSON.stringify($scope.Q));
        $scope.msgSteps[$scope.step] = updateMsg;

      }

      $scope.previousStep = function() {
        if ($scope.step == 0) {
          return;
        }
        $scope.step -= 1;
        $scope.data = $scope.dataSteps[$scope.step];
      }

      $scope.reset = function() {
        $scope.step = 0;
        $scope.data = $scope.dataSteps[$scope.step];
      }

      $scope.finalStep = function() {
        if ($scope.done) {
          // Don't update if already at last step
          if ($scope.step == $scope.dataSteps.length -1) {
            return;
          }
          $scope.step = $scope.dataSteps.length - 1;
          $scope.data = $scope.dataSteps[$scope.step];
        }
      }

      $scope.$watch('step', function(newData) {
        if ($scope.done && newData == ($scope.dataSteps.length - 1)) {
          $scope.hideForward = true;
        } else {
          $scope.hideForward = false;
        }
        if ($scope.step == 0) {
          $scope.hideBackward = true;
        } else {
          $scope.hideBackward = false;
        }
      }, true);
      
    }])
    // TODO: Cleanup into seperate JSON
    .controller('lifeCtrl', ['$scope', function($scope) {
      $scope.data = {
     "children": [{
         "name": "Bacteria",
         "children": [{
             "name": "66",
             "children": [{
                 "name": "74",
                 "children": [{
                     "name": "98",
                     "children": [{
                         "name": "82",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "54",
                                     "children": [{
                                         "name": "49",
                                         "children": [{
                                             "name": "98",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "81",
                                                     "children": [{
                                                         "name": "100",
                                                         "children": [{
                                                             "name": "100",
                                                             "children": [{
                                                                 "name": "98",
                                                                 "children": [{
                                                                     "name": "100",
                                                                     "children": [{
                                                                         "name": "100",
                                                                         "children": [{
                                                                             "name": "96",
                                                                             "children": [{
                                                                                 "name": "Escherichia_coli_EDL933",
                                                                                 "dist": 0
                                                                             }, {
                                                                                 "name": "Escherichia_coli_O157_H7",
                                                                                 "dist": 0
                                                                             }],
                                                                             "dist": 0.00044
                                                                         }, {
                                                                             "name": "75",
                                                                             "children": [{
                                                                                 "name": "76",
                                                                                 "children": [{
                                                                                     "name": "Escherichia_coli_O6",
                                                                                     "dist": 0
                                                                                 }, {
                                                                                     "name": "Escherichia_coli_K12",
                                                                                     "dist": 0.00022
                                                                                 }],
                                                                                 "dist": 0.00022
                                                                             }, {
                                                                                 "name": "100",
                                                                                 "children": [{
                                                                                     "name": "Shigella_flexneri_2a_2457T",
                                                                                     "dist": 0
                                                                                 }, {
                                                                                     "name": "Shigella_flexneri_2a_301",
                                                                                     "dist": 0
                                                                                 }],
                                                                                 "dist": 0.00266
                                                                             }],
                                                                             "dist": 0
                                                                         }],
                                                                         "dist": 0.00813
                                                                     }, {
                                                                         "name": "100",
                                                                         "children": [{
                                                                             "name": "100",
                                                                             "children": [{
                                                                                 "name": "Salmonella_enterica",
                                                                                 "dist": 0
                                                                             }, {
                                                                                 "name": "Salmonella_typhi",
                                                                                 "dist": 0
                                                                             }],
                                                                             "dist": 0.00146
                                                                         }, {
                                                                             "name": "Salmonella_typhimurium",
                                                                             "dist": 0.00075
                                                                         }],
                                                                         "dist": 0.00702
                                                                     }],
                                                                     "dist": 0.03131
                                                                 }, {
                                                                     "name": "61",
                                                                     "children": [{
                                                                         "name": "100",
                                                                         "children": [{
                                                                             "name": "Yersinia_pestis_Medievalis",
                                                                             "dist": 0
                                                                         }, {
                                                                             "name": "31",
                                                                             "children": [{
                                                                                 "name": "Yersinia_pestis_KIM",
                                                                                 "dist": 0
                                                                             }, {
                                                                                 "name": "Yersinia_pestis_CO92",
                                                                                 "dist": 0
                                                                             }],
                                                                             "dist": 0
                                                                         }],
                                                                         "dist": 0.03398
                                                                     }, {
                                                                         "name": "Photorhabdus_luminescens",
                                                                         "dist": 0.05076
                                                                     }],
                                                                     "dist": 0.01182
                                                                 }],
                                                                 "dist": 0.02183
                                                             }, {
                                                                 "name": "100",
                                                                 "children": [{
                                                                     "name": "100",
                                                                     "children": [{
                                                                         "name": "Blochmannia_floridanus",
                                                                         "dist": 0.32481
                                                                     }, {
                                                                         "name": "Wigglesworthia_brevipalpis",
                                                                         "dist": 0.35452
                                                                     }],
                                                                     "dist": 0.08332
                                                                 }, {
                                                                     "name": "100",
                                                                     "children": [{
                                                                         "name": "Buchnera_aphidicola_Bp",
                                                                         "dist": 0.27492
                                                                     }, {
                                                                         "name": "100",
                                                                         "children": [{
                                                                             "name": "Buchnera_aphidicola_APS",
                                                                             "dist": 0.09535
                                                                         }, {
                                                                             "name": "Buchnera_aphidicola_Sg",
                                                                             "dist": 0.10235
                                                                         }],
                                                                         "dist": 0.1014
                                                                     }],
                                                                     "dist": 0.06497
                                                                 }],
                                                                 "dist": 0.1503
                                                             }],
                                                             "dist": 0.02808
                                                         }, {
                                                             "name": "100",
                                                             "children": [{
                                                                 "name": "94",
                                                                 "children": [{
                                                                     "name": "Pasteurella_multocida",
                                                                     "dist": 0.03441
                                                                 }, {
                                                                     "name": "Haemophilus_influenzae",
                                                                     "dist": 0.03754
                                                                 }],
                                                                 "dist": 0.01571
                                                             }, {
                                                                 "name": "Haemophilus_ducreyi",
                                                                 "dist": 0.05333
                                                             }],
                                                             "dist": 0.07365
                                                         }],
                                                         "dist": 0.03759
                                                     }, {
                                                         "name": "100",
                                                         "children": [{
                                                             "name": "100",
                                                             "children": [{
                                                                 "name": "100",
                                                                 "children": [{
                                                                     "name": "100",
                                                                     "children": [{
                                                                         "name": "Vibrio_vulnificus_YJ016",
                                                                         "dist": 0.00021
                                                                     }, {
                                                                         "name": "Vibrio_vulnificus_CMCP6",
                                                                         "dist": 0.00291
                                                                     }],
                                                                     "dist": 0.01212
                                                                 }, {
                                                                     "name": "Vibrio_parahaemolyticus",
                                                                     "dist": 0.01985
                                                                 }],
                                                                 "dist": 0.01536
                                                             }, {
                                                                 "name": "Vibrio_cholerae",
                                                                 "dist": 0.02995
                                                             }],
                                                             "dist": 0.02661
                                                         }, {
                                                             "name": "Photobacterium_profundum",
                                                             "dist": 0.06131
                                                         }],
                                                         "dist": 0.05597
                                                     }],
                                                     "dist": 0.03492
                                                 }, {
                                                     "name": "Shewanella_oneidensis",
                                                     "dist": 0.10577
                                                 }],
                                                 "dist": 0.12234
                                             }, {
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "100",
                                                     "children": [{
                                                         "name": "Pseudomonas_putida",
                                                         "dist": 0.02741
                                                     }, {
                                                         "name": "Pseudomonas_syringae",
                                                         "dist": 0.03162
                                                     }],
                                                     "dist": 0.02904
                                                 }, {
                                                     "name": "Pseudomonas_aeruginosa",
                                                     "dist": 0.03202
                                                 }],
                                                 "dist": 0.14456
                                             }],
                                             "dist": 0.04492
                                         }, {
                                             "name": "100",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Xylella_fastidiosa_700964",
                                                     "dist": 0.01324
                                                 }, {
                                                     "name": "Xylella_fastidiosa_9a5c",
                                                     "dist": 0.00802
                                                 }],
                                                 "dist": 0.10192
                                             }, {
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Xanthomonas_axonopodis",
                                                     "dist": 0.01069
                                                 }, {
                                                     "name": "Xanthomonas_campestris",
                                                     "dist": 0.00934
                                                 }],
                                                 "dist": 0.05037
                                             }],
                                             "dist": 0.24151
                                         }],
                                         "dist": 0.02475
                                     }, {
                                         "name": "Coxiella_burnetii",
                                         "dist": 0.33185
                                     }],
                                     "dist": 0.03328
                                 }, {
                                     "name": "100",
                                     "children": [{
                                         "name": "75",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Neisseria_meningitidis_A",
                                                     "dist": 0.004
                                                 }, {
                                                     "name": "Neisseria_meningitidis_B",
                                                     "dist": 0.00134
                                                 }],
                                                 "dist": 0.12615
                                             }, {
                                                 "name": "Chromobacterium_violaceum",
                                                 "dist": 0.09623
                                             }],
                                             "dist": 0.07131
                                         }, {
                                             "name": "100",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Bordetella_pertussis",
                                                     "dist": 0.00127
                                                 }, {
                                                     "name": "67",
                                                     "children": [{
                                                         "name": "Bordetella_parapertussis",
                                                         "dist": 0.00199
                                                     }, {
                                                         "name": "Bordetella_bronchiseptica",
                                                         "dist": 0.00022
                                                     }],
                                                     "dist": 0.00006
                                                 }],
                                                 "dist": 0.14218
                                             }, {
                                                 "name": "Ralstonia_solanacearum",
                                                 "dist": 0.11464
                                             }],
                                             "dist": 0.08478
                                         }],
                                         "dist": 0.0384
                                     }, {
                                         "name": "Nitrosomonas_europaea",
                                         "dist": 0.22059
                                     }],
                                     "dist": 0.08761
                                 }],
                                 "dist": 0.16913
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "100",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "100",
                                                     "children": [{
                                                         "name": "Agrobacterium_tumefaciens_Cereon",
                                                         "dist": 0
                                                     }, {
                                                         "name": "Agrobacterium_tumefaciens_WashU",
                                                         "dist": 0
                                                     }],
                                                     "dist": 0.05735
                                                 }, {
                                                     "name": "Rhizobium_meliloti",
                                                     "dist": 0.05114
                                                 }],
                                                 "dist": 0.05575
                                             }, {
                                                 "name": "51",
                                                 "children": [{
                                                     "name": "100",
                                                     "children": [{
                                                         "name": "Brucella_suis",
                                                         "dist": 0.00102
                                                     }, {
                                                         "name": "Brucella_melitensis",
                                                         "dist": 0.00184
                                                     }],
                                                     "dist": 0.0866
                                                 }, {
                                                     "name": "Rhizobium_loti",
                                                     "dist": 0.09308
                                                 }],
                                                 "dist": 0.02384
                                             }],
                                             "dist": 0.08637
                                         }, {
                                             "name": "100",
                                             "children": [{
                                                 "name": "Rhodopseudomonas_palustris",
                                                 "dist": 0.04182
                                             }, {
                                                 "name": "Bradyrhizobium_japonicum",
                                                 "dist": 0.06346
                                             }],
                                             "dist": 0.14122
                                         }],
                                         "dist": 0.05767
                                     }, {
                                         "name": "Caulobacter_crescentus",
                                         "dist": 0.23943
                                     }],
                                     "dist": 0.11257
                                 }, {
                                     "name": "100",
                                     "children": [{
                                         "name": "Wolbachia_sp._wMel",
                                         "dist": 0.51596
                                     }, {
                                         "name": "100",
                                         "children": [{
                                             "name": "Rickettsia_prowazekii",
                                             "dist": 0.04245
                                         }, {
                                             "name": "Rickettsia_conorii",
                                             "dist": 0.02487
                                         }],
                                         "dist": 0.38019
                                     }],
                                     "dist": 0.12058
                                 }],
                                 "dist": 0.12365
                             }],
                             "dist": 0.06301
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "100",
                                         "children": [{
                                             "name": "Helicobacter_pylori_J99",
                                             "dist": 0.00897
                                         }, {
                                             "name": "Helicobacter_pylori_26695",
                                             "dist": 0.00637
                                         }],
                                         "dist": 0.19055
                                     }, {
                                         "name": "Helicobacter_hepaticus",
                                         "dist": 0.12643
                                     }],
                                     "dist": 0.0533
                                 }, {
                                     "name": "Wolinella_succinogenes",
                                     "dist": 0.11644
                                 }],
                                 "dist": 0.09105
                             }, {
                                 "name": "Campylobacter_jejuni",
                                 "dist": 0.20399
                             }],
                             "dist": 0.4139
                         }],
                         "dist": 0.04428
                     }, {
                         "name": "64",
                         "children": [{
                             "name": "69",
                             "children": [{
                                 "name": "Desulfovibrio_vulgaris",
                                 "dist": 0.3832
                             }, {
                                 "name": "43",
                                 "children": [{
                                     "name": "Geobacter_sulfurreducens",
                                     "dist": 0.22491
                                 }, {
                                     "name": "Bdellovibrio_bacteriovorus",
                                     "dist": 0.45934
                                 }],
                                 "dist": 0.0487
                             }],
                             "dist": 0.041
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Acidobacterium_capsulatum",
                                 "dist": 0.24572
                             }, {
                                 "name": "Solibacter_usitatus",
                                 "dist": 0.29086
                             }],
                             "dist": 0.20514
                         }],
                         "dist": 0.04214
                     }],
                     "dist": 0.05551
                 }, {
                     "name": "51",
                     "children": [{
                         "name": "35",
                         "children": [{
                             "name": "Fusobacterium_nucleatum",
                             "dist": 0.45615
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Aquifex_aeolicus",
                                 "dist": 0.40986
                             }, {
                                 "name": "Thermotoga_maritima",
                                 "dist": 0.34182
                             }],
                             "dist": 0.07696
                         }],
                         "dist": 0.03606
                     }, {
                         "name": "39",
                         "children": [{
                             "name": "35",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Thermus_thermophilus",
                                     "dist": 0.26583
                                 }, {
                                     "name": "Deinococcus_radiodurans",
                                     "dist": 0.29763
                                 }],
                                 "dist": 0.24776
                             }, {
                                 "name": "Dehalococcoides_ethenogenes",
                                 "dist": 0.53988
                             }],
                             "dist": 0.0437
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "98",
                                         "children": [{
                                             "name": "Nostoc_sp._PCC_7120",
                                             "dist": 0.12014
                                         }, {
                                             "name": "Synechocystis_sp._PCC6803",
                                             "dist": 0.15652
                                         }],
                                         "dist": 0.04331
                                     }, {
                                         "name": "Synechococcus_elongatus",
                                         "dist": 0.13147
                                     }],
                                     "dist": 0.0504
                                 }, {
                                     "name": "100",
                                     "children": [{
                                         "name": "74",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "Synechococcus_sp._WH8102",
                                                 "dist": 0.0678
                                             }, {
                                                 "name": "Prochlorococcus_marinus_MIT9313",
                                                 "dist": 0.05434
                                             }],
                                             "dist": 0.04879
                                         }, {
                                             "name": "Prochlorococcus_marinus_SS120",
                                             "dist": 0.10211
                                         }],
                                         "dist": 0.04238
                                     }, {
                                         "name": "Prochlorococcus_marinus_CCMP1378",
                                         "dist": 0.1617
                                     }],
                                     "dist": 0.20442
                                 }],
                                 "dist": 0.07646
                             }, {
                                 "name": "Gloeobacter_violaceus",
                                 "dist": 0.23764
                             }],
                             "dist": 0.24501
                         }],
                         "dist": 0.04332
                     }],
                     "dist": 0.0272
                 }],
                 "dist": 0.03471
             }, {
                 "name": "67",
                 "children": [{
                     "name": "23",
                     "children": [{
                         "name": "42",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "Gemmata_obscuriglobus",
                                 "dist": 0.36751
                             }, {
                                 "name": "Rhodopirellula_baltica",
                                 "dist": 0.38017
                             }],
                             "dist": 0.24062
                         }, {
                             "name": "95",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Leptospira_interrogans_L1-130",
                                     "dist": 0
                                 }, {
                                     "name": "Leptospira_interrogans_56601",
                                     "dist": 0.00027
                                 }],
                                 "dist": 0.47573
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "Treponema_pallidum",
                                         "dist": 0.25544
                                     }, {
                                         "name": "Treponema_denticola",
                                         "dist": 0.16072
                                     }],
                                     "dist": 0.19057
                                 }, {
                                     "name": "Borrelia_burgdorferi",
                                     "dist": 0.42323
                                 }],
                                 "dist": 0.20278
                             }],
                             "dist": 0.07248
                         }],
                         "dist": 0.04615
                     }, {
                         "name": "100",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Tropheryma_whipplei_TW08/27",
                                     "dist": 0.00009
                                 }, {
                                     "name": "Tropheryma_whipplei_Twist",
                                     "dist": 0.00081
                                 }],
                                 "dist": 0.44723
                             }, {
                                 "name": "Bifidobacterium_longum",
                                 "dist": 0.29283
                             }],
                             "dist": 0.14429
                         }, {
                             "name": "91",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "100",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "Corynebacterium_glutamicum_13032",
                                                 "dist": 0.00022
                                             }, {
                                                 "name": "Corynebacterium_glutamicum",
                                                 "dist": 0
                                             }],
                                             "dist": 0.03415
                                         }, {
                                             "name": "Corynebacterium_efficiens",
                                             "dist": 0.02559
                                         }],
                                         "dist": 0.03682
                                     }, {
                                         "name": "Corynebacterium_diphtheriae",
                                         "dist": 0.06479
                                     }],
                                     "dist": 0.13907
                                 }, {
                                     "name": "100",
                                     "children": [{
                                         "name": "97",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "Mycobacterium_bovis",
                                                 "dist": 0.00067
                                             }, {
                                                 "name": "98",
                                                 "children": [{
                                                     "name": "Mycobacterium_tuberculosis_CDC1551",
                                                     "dist": 0
                                                 }, {
                                                     "name": "Mycobacterium_tuberculosis_H37Rv",
                                                     "dist": 0
                                                 }],
                                                 "dist": 0.00022
                                             }],
                                             "dist": 0.03027
                                         }, {
                                             "name": "Mycobacterium_leprae",
                                             "dist": 0.05135
                                         }],
                                         "dist": 0.01514
                                     }, {
                                         "name": "Mycobacterium_paratuberculosis",
                                         "dist": 0.02091
                                     }],
                                     "dist": 0.11523
                                 }],
                                 "dist": 0.09883
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "Streptomyces_avermitilis",
                                     "dist": 0.0268
                                 }, {
                                     "name": "Streptomyces_coelicolor",
                                     "dist": 0.02678
                                 }],
                                 "dist": 0.16707
                             }],
                             "dist": 0.0611
                         }],
                         "dist": 0.268
                     }],
                     "dist": 0.0348
                 }, {
                     "name": "32",
                     "children": [{
                         "name": "62",
                         "children": [{
                             "name": "Fibrobacter_succinogenes",
                             "dist": 0.51984
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Chlorobium_tepidum",
                                 "dist": 0.37204
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "Porphyromonas_gingivalis",
                                     "dist": 0.11304
                                 }, {
                                     "name": "Bacteroides_thetaiotaomicron",
                                     "dist": 0.13145
                                 }],
                                 "dist": 0.34694
                             }],
                             "dist": 0.09237
                         }],
                         "dist": 0.04841
                     }, {
                         "name": "100",
                         "children": [{
                             "name": "98",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Chlamydophila_pneumoniae_TW183",
                                     "dist": 0
                                 }, {
                                     "name": "44",
                                     "children": [{
                                         "name": "Chlamydia_pneumoniae_J138",
                                         "dist": 0
                                     }, {
                                         "name": "37",
                                         "children": [{
                                             "name": "Chlamydia_pneumoniae_CWL029",
                                             "dist": 0
                                         }, {
                                             "name": "Chlamydia_pneumoniae_AR39",
                                             "dist": 0
                                         }],
                                         "dist": 0
                                     }],
                                     "dist": 0
                                 }],
                                 "dist": 0.10482
                             }, {
                                 "name": "Chlamydophila_caviae",
                                 "dist": 0.05903
                             }],
                             "dist": 0.0417
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Chlamydia_muridarum",
                                 "dist": 0.01938
                             }, {
                                 "name": "Chlamydia_trachomatis",
                                 "dist": 0.02643
                             }],
                             "dist": 0.06809
                         }],
                         "dist": 0.60169
                     }],
                     "dist": 0.04443
                 }],
                 "dist": 0.04284
             }],
             "dist": 0.02646
         }, {
             "name": "54",
             "children": [{
                 "name": "100",
                 "children": [{
                     "name": "Thermoanaerobacter_tengcongensis",
                     "dist": 0.17512
                 }, {
                     "name": "100",
                     "children": [{
                         "name": "78",
                         "children": [{
                             "name": "Clostridium_tetani",
                             "dist": 0.10918
                         }, {
                             "name": "Clostridium_perfringens",
                             "dist": 0.11535
                         }],
                         "dist": 0.03238
                     }, {
                         "name": "Clostridium_acetobutylicum",
                         "dist": 0.11396
                     }],
                     "dist": 0.15056
                 }],
                 "dist": 0.11788
             }, {
                 "name": "92",
                 "children": [{
                     "name": "100",
                     "children": [{
                         "name": "100",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Mycoplasma_mobile",
                                     "dist": 0.27702
                                 }, {
                                     "name": "Mycoplasma_pulmonis",
                                     "dist": 0.28761
                                 }],
                                 "dist": 0.28466
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "94",
                                     "children": [{
                                         "name": "100",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "Mycoplasma_pneumoniae",
                                                 "dist": 0.10966
                                             }, {
                                                 "name": "Mycoplasma_genitalium",
                                                 "dist": 0.11268
                                             }],
                                             "dist": 0.31768
                                         }, {
                                             "name": "Mycoplasma_gallisepticum",
                                             "dist": 0.24373
                                         }],
                                         "dist": 0.1418
                                     }, {
                                         "name": "Mycoplasma_penetrans",
                                         "dist": 0.3489
                                     }],
                                     "dist": 0.06674
                                 }, {
                                     "name": "Ureaplasma_parvum",
                                     "dist": 0.33874
                                 }],
                                 "dist": 0.19177
                             }],
                             "dist": 0.07341
                         }, {
                             "name": "Mycoplasma_mycoides",
                             "dist": 0.3768
                         }],
                         "dist": 0.12541
                     }, {
                         "name": "Phytoplasma_Onion_yellows",
                         "dist": 0.47843
                     }],
                     "dist": 0.09099
                 }, {
                     "name": "100",
                     "children": [{
                         "name": "64",
                         "children": [{
                             "name": "69",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "90",
                                     "children": [{
                                         "name": "Listeria_monocytogenes_F2365",
                                         "dist": 0.00063
                                     }, {
                                         "name": "Listeria_monocytogenes_EGD",
                                         "dist": 0.00144
                                     }],
                                     "dist": 0.00235
                                 }, {
                                     "name": "Listeria_innocua",
                                     "dist": 0.00248
                                 }],
                                 "dist": 0.13517
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "91",
                                     "children": [{
                                         "name": "Oceanobacillus_iheyensis",
                                         "dist": 0.13838
                                     }, {
                                         "name": "Bacillus_halodurans",
                                         "dist": 0.0928
                                     }],
                                     "dist": 0.02676
                                 }, {
                                     "name": "96",
                                     "children": [{
                                         "name": "100",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "Bacillus_cereus_ATCC_14579",
                                                 "dist": 0.00342
                                             }, {
                                                 "name": "Bacillus_cereus_ATCC_10987",
                                                 "dist": 0.00123
                                             }],
                                             "dist": 0.00573
                                         }, {
                                             "name": "Bacillus_anthracis",
                                             "dist": 0.00331
                                         }],
                                         "dist": 0.08924
                                     }, {
                                         "name": "Bacillus_subtilis",
                                         "dist": 0.07876
                                     }],
                                     "dist": 0.01984
                                 }],
                                 "dist": 0.03907
                             }],
                             "dist": 0.02816
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Staphylococcus_aureus_MW2",
                                     "dist": 0
                                 }, {
                                     "name": "61",
                                     "children": [{
                                         "name": "Staphylococcus_aureus_N315",
                                         "dist": 0.00022
                                     }, {
                                         "name": "Staphylococcus_aureus_Mu50",
                                         "dist": 0.00022
                                     }],
                                     "dist": 0.00022
                                 }],
                                 "dist": 0.02479
                             }, {
                                 "name": "Staphylococcus_epidermidis",
                                 "dist": 0.03246
                             }],
                             "dist": 0.17366
                         }],
                         "dist": 0.02828
                     }, {
                         "name": "100",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "99",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Streptococcus_agalactiae_III",
                                                     "dist": 0.0011
                                                 }, {
                                                     "name": "Streptococcus_agalactiae_V",
                                                     "dist": 0.00155
                                                 }],
                                                 "dist": 0.01637
                                             }, {
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Streptococcus_pyogenes_M1",
                                                     "dist": 0.00134
                                                 }, {
                                                     "name": "87",
                                                     "children": [{
                                                         "name": "Streptococcus_pyogenes_MGAS8232",
                                                         "dist": 0.00045
                                                     }, {
                                                         "name": "100",
                                                         "children": [{
                                                             "name": "Streptococcus_pyogenes_MGAS315",
                                                             "dist": 0
                                                         }, {
                                                             "name": "Streptococcus_pyogenes_SSI-1",
                                                             "dist": 0.00022
                                                         }],
                                                         "dist": 0.0011
                                                     }],
                                                     "dist": 0.00066
                                                 }],
                                                 "dist": 0.0225
                                             }],
                                             "dist": 0.0136
                                         }, {
                                             "name": "Streptococcus_mutans",
                                             "dist": 0.04319
                                         }],
                                         "dist": 0.0192
                                     }, {
                                         "name": "100",
                                         "children": [{
                                             "name": "Streptococcus_pneumoniae_R6",
                                             "dist": 0.00119
                                         }, {
                                             "name": "Streptococcus_pneumoniae_TIGR4",
                                             "dist": 0.00124
                                         }],
                                         "dist": 0.03607
                                     }],
                                     "dist": 0.04983
                                 }, {
                                     "name": "Lactococcus_lactis",
                                     "dist": 0.11214
                                 }],
                                 "dist": 0.08901
                             }, {
                                 "name": "Enterococcus_faecalis",
                                 "dist": 0.07946
                             }],
                             "dist": 0.03958
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Lactobacillus_johnsonii",
                                 "dist": 0.20999
                             }, {
                                 "name": "Lactobacillus_plantarum",
                                 "dist": 0.14371
                             }],
                             "dist": 0.06763
                         }],
                         "dist": 0.08989
                     }],
                     "dist": 0.08905
                 }],
                 "dist": 0.0954
             }],
             "dist": 0.04315
         }],
         "dist": 1.34959
     }, {
         "name": "",
         "children": [{
             "name": "100",
             "children": [{
                 "name": "100",
                 "children": [{
                     "name": "87",
                     "children": [{
                         "name": "42",
                         "children": [{
                             "name": "Thalassiosira_pseudonana",
                             "dist": 0.33483
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Cryptosporidium_hominis",
                                 "dist": 0.25048
                             }, {
                                 "name": "Plasmodium_falciparum",
                                 "dist": 0.28267
                             }],
                             "dist": 0.14359
                         }],
                         "dist": 0.03495
                     }, {
                         "name": "44",
                         "children": [{
                             "name": "96",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Oryza_sativa",
                                     "dist": 0.07623
                                 }, {
                                     "name": "Arabidopsis_thaliana",
                                     "dist": 0.09366
                                 }],
                                 "dist": 0.1577
                             }, {
                                 "name": "Cyanidioschyzon_merolae",
                                 "dist": 0.38319
                             }],
                             "dist": 0.08133
                         }, {
                             "name": "41",
                             "children": [{
                                 "name": "Dictyostelium_discoideum",
                                 "dist": 0.34685
                             }, {
                                 "name": "85",
                                 "children": [{
                                     "name": "100",
                                     "children": [{
                                         "name": "100",
                                         "children": [{
                                             "name": "Eremothecium_gossypii",
                                             "dist": 0.07298
                                         }, {
                                             "name": "Saccharomyces_cerevisiae",
                                             "dist": 0.07619
                                         }],
                                         "dist": 0.2117
                                     }, {
                                         "name": "Schizosaccharomyces_pombe",
                                         "dist": 0.24665
                                     }],
                                     "dist": 0.1537
                                 }, {
                                     "name": "100",
                                     "children": [{
                                         "name": "95",
                                         "children": [{
                                             "name": "100",
                                             "children": [{
                                                 "name": "Anopheles_gambiae",
                                                 "dist": 0.10724
                                             }, {
                                                 "name": "Drosophila_melanogaster",
                                                 "dist": 0.10233
                                             }],
                                             "dist": 0.0987
                                         }, {
                                             "name": "100",
                                             "children": [{
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "Takifugu_rubripes",
                                                     "dist": 0.03142
                                                 }, {
                                                     "name": "Danio_rerio",
                                                     "dist": 0.0523
                                                 }],
                                                 "dist": 0.04335
                                             }, {
                                                 "name": "100",
                                                 "children": [{
                                                     "name": "99",
                                                     "children": [{
                                                         "name": "91",
                                                         "children": [{
                                                             "name": "Rattus_norvegicus",
                                                             "dist": 0.03107
                                                         }, {
                                                             "name": "Mus_musculus",
                                                             "dist": 0.01651
                                                         }],
                                                         "dist": 0.00398
                                                     }, {
                                                         "name": "100",
                                                         "children": [{
                                                             "name": "Homo_sapiens",
                                                             "dist": 0.00957
                                                         }, {
                                                             "name": "Pan_troglodytes",
                                                             "dist": 0.03864
                                                         }],
                                                         "dist": 0.01549
                                                     }],
                                                     "dist": 0.01629
                                                 }, {
                                                     "name": "Gallus_gallus",
                                                     "dist": 0.04596
                                                 }],
                                                 "dist": 0.01859
                                             }],
                                             "dist": 0.09688
                                         }],
                                         "dist": 0.03693
                                     }, {
                                         "name": "100",
                                         "children": [{
                                             "name": "Caenorhabditis_elegans",
                                             "dist": 0.01843
                                         }, {
                                             "name": "Caenorhabditis_briggsae",
                                             "dist": 0.01896
                                         }],
                                         "dist": 0.24324
                                     }],
                                     "dist": 0.09911
                                 }],
                                 "dist": 0.04004
                             }],
                             "dist": 0.02708
                         }],
                         "dist": 0.02636
                     }],
                     "dist": 0.06455
                 }, {
                     "name": "Leishmania_major",
                     "dist": 0.45664
                 }],
                 "dist": 0.10129
             }, {
                 "name": "Giardia_lamblia",
                 "dist": 0.55482
             }],
             "dist": 0.57543
         }, {
             "name": "100",
             "children": [{
                 "name": "100",
                 "children": [{
                     "name": "Nanoarchaeum_equitans",
                     "dist": 0.81078
                 }, {
                     "name": "100",
                     "children": [{
                         "name": "94",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "Sulfolobus_tokodaii",
                                 "dist": 0.17389
                             }, {
                                 "name": "Sulfolobus_solfataricus",
                                 "dist": 0.18962
                             }],
                             "dist": 0.3372
                         }, {
                             "name": "Aeropyrum_pernix",
                             "dist": 0.4338
                         }],
                         "dist": 0.09462
                     }, {
                         "name": "Pyrobaculum_aerophilum",
                         "dist": 0.55514
                     }],
                     "dist": 0.12018
                 }],
                 "dist": 0.15444
             }, {
                 "name": "99",
                 "children": [{
                     "name": "100",
                     "children": [{
                         "name": "Thermoplasma_volcanium",
                         "dist": 0.10412
                     }, {
                         "name": "Thermoplasma_acidophilum",
                         "dist": 0.09785
                     }],
                     "dist": 0.66151
                 }, {
                     "name": "62",
                     "children": [{
                         "name": "51",
                         "children": [{
                             "name": "100",
                             "children": [{
                                 "name": "99",
                                 "children": [{
                                     "name": "Methanobacterium_thermautotrophicum",
                                     "dist": 0.36583
                                 }, {
                                     "name": "Methanopyrus_kandleri",
                                     "dist": 0.35331
                                 }],
                                 "dist": 0.07446
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "Methanococcus_maripaludis",
                                     "dist": 0.28592
                                 }, {
                                     "name": "Methanococcus_jannaschii",
                                     "dist": 0.13226
                                 }],
                                 "dist": 0.23828
                             }],
                             "dist": 0.06284
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "100",
                                 "children": [{
                                     "name": "Pyrococcus_horikoshii",
                                     "dist": 0.02786
                                 }, {
                                     "name": "Pyrococcus_abyssi",
                                     "dist": 0.02179
                                 }],
                                 "dist": 0.02239
                             }, {
                                 "name": "Pyrococcus_furiosus",
                                 "dist": 0.02366
                             }],
                             "dist": 0.3622
                         }],
                         "dist": 0.04469
                     }, {
                         "name": "100",
                         "children": [{
                             "name": "Archaeoglobus_fulgidus",
                             "dist": 0.3466
                         }, {
                             "name": "100",
                             "children": [{
                                 "name": "Halobacterium_sp._NRC-1",
                                 "dist": 0.61597
                             }, {
                                 "name": "100",
                                 "children": [{
                                     "name": "Methanosarcina_acetivorans",
                                     "dist": 0.02602
                                 }, {
                                     "name": "Methanosarcina_mazei",
                                     "dist": 0.03087
                                 }],
                                 "dist": 0.30588
                             }],
                             "dist": 0.12801
                         }],
                         "dist": 0.10395
                     }],
                     "dist": 0.06815
                 }],
                 "dist": 0.11833
             }],
             "dist": 0.43325
         }],
         "dist": 0.88776
     }],
     "name": ""
 };
    }]);
}());
