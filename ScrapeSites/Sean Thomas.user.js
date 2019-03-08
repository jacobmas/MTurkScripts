// ==UserScript==
// @name         Sean Thomas
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Different Type of Dealer Shit Fuck
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @rquire https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Miscellaneous/DQInternal.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["facebook.com","twitter.com","profilecanada.com","findstorenearme.ca","wheelsonline.ca","canadapages.com",
                 "411directoryassistance.ca"];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A260CYE0G40LQV",true);
    var MTP=MTurkScript.prototype;
    var DQ={dealer_regex:new RegExp(
        "www\\.360\\.agency|"+
        "www\\.allautonetwork\\.com|webstatic\\.auction123\\.com|"+
        "www\\.(auto(conx|corner|dealerwebsites|drivenmarketing|funds|jini|manager|revo|searchtech|webexpress))\\.com|"+
        "\\/\\/auto(drivenmarketing|motiveleads)\\.com|www\\.autosalesweb\\.net|www\\.bwebauto\\.com|"+
        "www\\.(car(base|guywebdesign|max|prolive|sforsale|think)).com|www\\.carwizard\\.net|www\\.chromacars\\.com|"+
        "www\\.convertus\\.com|"+
        "(www|static)\\.dealer\\.com|\\/dealeron\\.js|www\\.dealercity\\.(ca|com)|"+
        "www\\.(dealer(carsearch|center|eprocess|fire|inspire|on|pac|peak|scloud|specialties|spike|spiketruck|sync|websites))\\.com|"+
        "dealerclick\\.com|www\\.dealerexpress\\.net|\\/\\/dealer(city|leads)\\.com|cdn\\.dealereprocess\\.org|"+
        "(\\/\\/|inventoryplus\\.)dealersocket\\.com|\\/\\/dealerseo\\.net|dealersiteplus\\.ca|dealer-cdn\\.dealersync\\.com|"+
        "\\/\\/dealersolutionssoftware\\.com|www\\.(dssal|drive(dominion|time))\\.com|www\\.d2cmedia\\.ca|"+
        "(www|images)\\.ebizautos\\.com|"+
        "www\\.edealer\\.ca|(www\\.|\\/\\/)evolio\\.ca|www\\.ez-results\\.ca|"+
        "foxdealerinteractive\\.com|www\\.fridaynet\\.com|www\\.fzautomotive\\.com|www\\.goauto\\.ca|www\\.higherturnover\\.com|"+
        "www\\.interactivedms\\.com|(www|tracking)\\.hasyourcar\\.com|"+
        "www\\.jazelauto\\.com|analytics\\.jazel\\.net|(images-stag|userlogin)\\.jazelc\\.com|"+
        "www\\.(jdbyrider|lotboys|motorcarmarketing|wearefullthrottle)\\.com|"+
        "\\/\\/kukui\\.com|(\\/\\/|\\/\\/leadboxhq\\.com|"+
        "www\\.)lotwizard\\.com|media-cf\\.assets-cdk\\.com|"+
        "(www|secure[0-9])\\.motionfuze\\.com|(www\\.|\\/\\/)nakedlime\\.com|(www\\.|\\/\\/)obbauto\\.com|"+
        "(www\\.|\\/\\/)prontodealer\\.com|\\/\\/remora\\.com|www\\.solutionsmedias360\\.com|"+
        "www\\.stormdivision\\.com|strathcom\\.com|"+
        "www\\.vicimus\\.com|(www|cdn-w)\\.v12soft(|ware)\\.com|"+
        "(\\/\\/|www\\.)waynereaves\\.com|www\\.(wearefullthrottle|webstreak)\\.com|www\\.yourcarlot\\.com","i"),
             
           dealer_map:{"fridaynet":"lotwizard","dealersocket":"dealerfire","dealerseo":"automotiveleads",
                       "dealerleads":"automotiveleads","v12soft":"v12software","jazelc":"jazelauto","dealerspiketruck":"dealerspike",
                       "solutionsmedias360":"360"
                      },
         begin_year:1981,
         make_rx_str:"Acura|Audi|BMW|Buick|Cadillac|Can-Am|Chevrolet|Chrysler|Dodge|Entegra|Ferrari|Fiat|Ford|GMC|"+
          "Honda|Hummer|Hyundai|Infiniti|Isuzu|Jaguar|Jeep|Kia|Land Rover|Lexux|Lincoln|"+
          "Mazda|Mercedes-Benz|Mercury|Mini|Mitsubishi|Nissan|Plymouth|Pontiac|Porsche|"+
          "Ram|Saab|Saturn|Scion|Smart|Subaru|Suzuki|Toyota|Volkswagen|Volvo",
           employee_list:[],email_list:[]};

    DQ.find_link=function(doc,url,resolve,reject,page_type) {
        for(var i=0; i < doc.links.length; i++) {
            doc.links[i].href=MTurkScript.prototype.fix_remote_url(doc.links[i].href,url);
          //  console.log("doc.links["+i+"]="+doc.links[i].href+", "+doc.links[i].innerText);
            if(page_type.team_href_rx.test(doc.links[i].href) &&
               page_type.team_text_rx.test(MTP.removeDiacritics(doc.links[i].innerText))
              && (!page_type.team_bad_text_rx || !page_type.team_bad_text_rx.test(MTP.removeDiacritics(doc.links[i].innerText)))
              ) return MTurkScript.prototype.fix_remote_url(doc.links[i].href,url);}
        return url;
    };
    DQ.parse_team_360=function(doc,url,resolve,reject) {
        console.log("In parse_team_360 at "+url);
        var team=doc.querySelectorAll(".listing-employee__department-employee-item,.listing-employee__preview"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".listing-employee__department-employee-name,[itemprop='headline']":"name",
                           ".listing-employee__department-employee-job,[itemprop='reviewBody']":"title",
                           ".listing-employee__department-employee-phone":"phone",".listing-employee__department-employee-email":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        team=doc.querySelectorAll(".employee");
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".employee__box-info_name,.employee-name":"name",
                           ".employee-firstname":"firstname",".employee-lastname":"lastname",
                           ".employee__box-info_job,.employee-job,.employee-department":"title",".employee__box-info_cta,a.cta,.employee-email a":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
             if(emp.firstname && emp.lastname) emp.name=emp.firstname+" "+emp.lastname;
            DQ.employee_list.push(emp);

         });
        team=doc.querySelectorAll(".listing-employees .card"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".name":"name",".jobTitle":"title"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            if(dets.href && (match=dets.href.match(/mailto:\s*(.*)$/))) emp.email=match[1];
            DQ.employee_list.push(emp);

         });
        team=doc.querySelectorAll(".employee-listing,.listing-employee-premium__department-employee-item,.departement_employee");
        team.forEach(function(dets) {
            Gov.fix_emails(dets,true);
            var ret=Gov.parse_data_func(dets.innerText);
            if(ret) DQ.employee_list.push(ret);
        });
        resolve("");
    };
    DQ.parse_team_assets_cdk=function(doc,url,resolve,reject) {
        DQ.parse_employees(doc,url,resolve,reject);
        resolve("");
    };
    DQ.parse_team_bwebauto=function(doc,url,resolve,reject) {
        console.log("In DQ.parse_team_bwebauto,url="+url);
        var team=doc.querySelectorAll(".team-list-item"),match;
        team.forEach(DQ.parseEmployee);
        team=doc.querySelectorAll(".item"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".title":"name",".job":"title",".phone":"phone",".email a":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && field.href && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else if(term_map[x]!=="email") emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        team=doc.querySelectorAll(".employee"),match;
        team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".employee__name":"name","[itemprop='reviewBody']":"title",".phone":"phone","[itemprop='url']":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && field.href && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else if(term_map[x]!=="email") emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        resolve("");
    };
    DQ.parse_team_convertus=function(doc,url,resolve,reject) {
        console.log("In parse_team_convertus at "+url);
        var scripts=doc.scripts,i,regex=/var convertusMethods/,emailMatch;
        for(i=0;i<scripts.length;i++) if(scripts[i].innerHTML.match(regex) && (emailMatch=scripts[i].innerHTML.match(email_re))) break;
        var team=doc.querySelectorAll(".team-info"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""},temp_email;
             var term_map={"h4":"name","p":"title",},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && field.href && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
             if(emp.name.length>0 && emailMatch.length>0 && (temp_email=DQ.match_email(emailMatch,emp.name))) emp.email=temp_email;
             else if(emailMatch.length>0) emp.email=emailMatch[0];
            DQ.employee_list.push(emp);

         });
        resolve("");
    };
    DQ.parse_team_d2cmedia=function(doc,url,resolve,reject) {
        console.log("In parse_team_d2cmedia at "+url);
        var team=doc.querySelectorAll(".mainbox291"),match,temp_email;
        var email_items=doc.querySelectorAll("input[id*='email' i]");
        email_items.forEach(function(item) {
            if((match=item.value.match(email_re))) {
                for(var i=0;i<match.length;i++) if(!DQ.email_list.includes(match[i])) DQ.email_list.push(match[i]);
            }
        });
        console.log("DQ.email_list="+JSON.stringify(DQ.email_list));
        team.forEach(function(dets) {
            var emp={name:"",title:"",phone:"",email:""};
            var term_map={"[itemprop='name']":"name","[itemprop='title']":"title","[itemprop='phone']":"phone","[itemprop='email']":"email"},x,field,match;
            for(x in term_map) {
                if((field=dets.querySelector(x))) {
                    if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                    else emp[term_map[x]]=field.innerText.trim();
                }
            }
            if(emp.name.length>0 && (temp_email=DQ.match_email(DQ.email_list,emp.name))) emp.email=temp_email;
            DQ.employee_list.push(emp);
        });
        resolve("");
    };
    DQ.parse_team_dealer=function(doc,url,resolve,reject) {
        DQ.parse_vcard(doc,url,resolve,reject);
        var team=doc.querySelectorAll(".mainbox291");
        team.forEach(DQ.parseEmployee);
        var td=doc.querySelectorAll("td");
        td.forEach(function(elem) {
            var ret=Gov.parse_data_func(elem.innerText);
            if(ret) DQ.employee_list.push(ret);
        });
        var ddc=doc.querySelectorAll(".ddc-content .content");
        ddc.forEach(function(elem) {
            var emp={name:"",title:"",phone:"",email:""};
            var name=elem.querySelector("div span font b"),parentdiv,a,match;
            emp.name=name?name.innerText:"";
            if(name&&(parentdiv=name.parentNode.parentNode.parentNode.querySelector("div"))) {

                var title=parentdiv.querySelector("div font");
                emp.title=title?title.innerText:"";
                a=parentdiv.querySelector("a");
                if(a && a.href && (match=a.href.match(/mailto:\s*(.*)$/))) emp.email=match[1];
            }
            DQ.employee_list.push(emp);
        });

        resolve("");
    };
    DQ.parse_team_dealercity=function(doc,url,resolve,reject) {
        console.log("In parse_team_dealercity at "+url);
        var team=doc.querySelectorAll(".our-team"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".name":"name",".position":"title",".phone":"phone",".email":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && field.href && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        resolve("");
    };
    DQ.parse_team_dealerfire=function(doc,url,resolve,reject) {
        DQ.parse_vcard(doc,url,resolve,reject);
        var team=doc.querySelectorAll(".com-our-team-responsive2__employee");
        team.forEach(function(dets) {
            Gov.fix_emails(dets,true);
            var ret=Gov.parse_data_func(dets.innerText);
            if(ret) DQ.employee_list.push(ret);
        });
        resolve("");
    };
    DQ.parse_team_dealerinspire=function(doc,url,resolve,reject) {
        console.log("In parse_team_dealerinspire at "+url);
        var team=doc.querySelectorAll(".staff-item"),match;
        if(!team || team.length===0) team=doc.querySelectorAll(".staff");
        team.forEach(function(dets) {
            var emp={name:"",title:"",phone:"",email:""};
            var term_map={"h3":"name","h4":"title",".staffphone":"phone",".staff-email-button,.staff-button":"email"},x,field,match;
            for(x in term_map) {
                if((field=dets.querySelector(x))) {
                    if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                    else emp[term_map[x]]=field.innerText.trim();
                }
            }
            DQ.employee_list.push(emp);

        });
        resolve("");
    };
    DQ.parse_team_dealeron=function(doc,url,resolve,reject) {
        console.log("In parse_team_dealeron at "+url);
        var team=doc.querySelectorAll(".staff-card"),match;
        team.forEach(function(dets) {
            var emp={name:"",title:"",phone:"",email:""};
            var term_map={".staff-title":"name",".staff-desc":"title",".phone1":"phone",".email":"email"},x,field,match;
            for(x in term_map) {
                if((field=dets.querySelector(x))) {
                    if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                    else emp[term_map[x]]=field.innerText.trim();
                }
            }
            DQ.employee_list.push(emp);

        });
        resolve("");
    };
    DQ.parse_team_dealerspike=function(doc,url,resolve,reject) {
        console.log("In parse_team_dealerspike at "+url);
        var team=doc.querySelectorAll(".person"),match;
        team.forEach(function(dets) {
            var emp={name:"",title:"",phone:"",email:""};
            var term_map={".name":"name",".title":"title"},x,field,match;
            for(x in term_map) {
                if((field=dets.querySelector(x))) {
                    if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                    else emp[term_map[x]]=field.innerText.trim();
                }
            }
            DQ.employee_list.push(emp);

        });
        resolve("");
    };
    DQ.parse_team_dealersiteplus=function(doc,url,resolve,reject) {
        var container=doc.querySelectorAll(".container");
        container.forEach(function(dets) {
            var emp={name:"",title:"",phone:"",email:""};
            var ret=Gov.parse_data_func(dets.innerText);
            if(ret) DQ.employee_list.push(ret);
        });
        resolve("");
    };
    DQ.parse_team_drivingdealersolutions=function(doc,url,resolve,reject) {
        console.log("In parse_team_drivingdealersolutions at "+url);
        var team=doc.querySelectorAll(".ourteam-usergroup ul"),match;
        team.forEach(function(dets) {
            var ret=Gov.parse_data_func(dets.innerText);
            DQ.employee_list.push(ret);

        });
        resolve("");
    };
    DQ.parse_team_edealer=function(doc,url,resolve,reject) {
        console.log("In parse_team_edealer at "+url);
        var details=doc.querySelectorAll(".details-sect,.team-items item"),match;
        if(details.length===0) details=doc.querySelectorAll(".member-list .box-container");
        details.forEach(function(dets) {
            var emp={name:"",title:"",phone:"",email:""};
            var term_map={".name,.team-title":"name",".title,.team-position":"title",".phone-num":"phone",".email":"email"},x,field,match;
            for(x in term_map) {
                if((field=dets.querySelector(x))) {
                    if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                    else if(term_map[x]!=="email") emp[term_map[x]]=field.innerText.trim();
                }
            }
            if(emp.email.length===0 && (match=dets.innerText.match(email_re))) emp.email=match[0];
            DQ.employee_list.push(emp);
        });
        resolve("");
    };
    DQ.parse_team_evolio=function(doc,url,resolve,reject) {
         console.log("In parse_team_evolio at "+url);
         var team=doc.querySelectorAll(".our-team"),a;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".name":"name",".position":"title",".phone":"phone",".email":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" &&
                        ((field.href &&
                          (match=field.href.match(/mailto:\s*(.*)$/))) || ((a=field.querySelector("a")) &&
                                                                           (match=a.href.match(/mailto:\s*(.*)$/))
                                                                          ))) emp[term_map[x]]=match[1];
                     else  emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        team=doc.querySelectorAll(".box-inner");
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={"h2":"name","h3.tm-title":"title",".phone":"phone",".tm-member-contact a":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) emp[term_map[x]]=field.innerText.trim();
             }
            DQ.employee_list.push(emp);

         });
         resolve("");
     };
    DQ.parse_team_ez_results=function(doc,url,resolve,reject) {
        console.log("In parse_team_ez_results at "+url);
        var team=doc.querySelectorAll(".teamColumn,.team,.teamCol"),match;
        if(team.length===0) team=doc.querySelectorAll(".wbox");
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".teamName,.name":"name",".teamPosition,.position":"title",".teamPhone":"phone",".btn-email,.ez-btn,.emailButton":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });

        resolve("");
    };
    DQ.parse_team_FordDirect=function(doc,url,resolve,reject) {
        let temp_url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1");
        temp_url=temp_url+"/data/employees.json";
        console.log("temp_url="+temp_url);
        var promise=MTP.create_promise(temp_url,DQ.parse_team_FordDirect_JSON,resolve,reject);
    };
    DQ.parse_team_FordDirect_JSON=function(doc,url,resolve,reject,response) {
        try {
            let parsed=JSON.parse(response.responseText),x,emp,i;
            if(!parsed.staff) {
               // console.log("Not parsed.staff, parsed="+JSON.stringify(parsed));
                parsed.staff=[];
                for(i=0;i<parsed.length;i++) {
                    parsed.staff=parsed.staff.concat(parsed[i].staff); }
            }

            if(parsed&&parsed.staff) {
               // console.log("parsed.staff="+JSON.stringify(parsed.staff));
                for(x of parsed.staff) {
                    //console.log("x="+JSON.stringify(x));
                    emp={name:"",title:"",email:"",phone:""};
                    if(x.firstname || x.lastname) emp.name=(x.firstname?x.firstname:"")+" "+(x.lastname?x.lastname:"");
                    if(x.email) emp.email=x.email;
                    if(x.title) emp.title=x.title;
                    DQ.employee_list.push(emp);

                }
            }
            else if(parsed) {
                for(x in parsed) console.log("parsed["+x+"]="+JSON.stringify(parsed[x]));
                console.log("Could not find parsed.staff");
                reject("");
            }

        }
        catch(error) {
            console.log("Error parsing JSON in FordDirect "+error);
            reject("");
            return;
        }
        resolve("");


    };
    DQ.parse_team_goauto=function(doc,url,resolve,reject) {
         console.log("In parse_team_goauto at "+url);
         var team=doc.querySelectorAll(".staff-card"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".name":"name",".position":"title",".contact-email":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
         resolve("");
     };
    DQ.parse_team_leadboxhq=function(doc,url,resolve,reject,response) {
        var parsed,i,x,emp;
        try {
            parsed=JSON.parse(response.responseText);
            for(i=0;i<parsed.length;i++) {
                emp={name:(parsed[i].name?parsed[i].name+" ":"")+(parsed[i].lastname?parsed[i].lastname:""),
                     title:parsed[i].title?parsed[i].title:"",email:parsed[i].email?parsed[i].email:"",
                     phone:parsed[i].phone?parsed[i].phone:""};
                DQ.employee_list.push(emp);
            }
        }
        catch(error) { console.log("Error parsing JSON "+error);
                      reject("");
                      return; }
        resolve("");
    };
    DQ.parse_team_nakedlime=function(doc,url,resolve,reject) {
        console.log("In parse_team_nakedlime at "+url);
        var team=doc.querySelectorAll(".staff"),match;
         team.forEach(DQ.parseEmployee);
        resolve("");
    };
    DQ.parse_team_stormdivision=function(doc,url,resolve,reject) {
        console.log("In parse_team_stormdivision at "+url);
        var team=doc.querySelectorAll(".staff"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".sname":"name",".sjob":"title",".sphone":"phone",".semail":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        DQ.parse_employees(doc,url,resolve,reject);
        resolve("");
    };
    DQ.parse_team_strathcom=function(doc,url,resolve,reject) {
        console.log("In parse_team_strathcom at "+url);
        var team=doc.querySelectorAll(".staff-card,.staff-container"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".name,.staff-name":"name",".position,.staff-title":"title",".phone1,.staff-phone":"phone",".contact-email,.staff-email":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        DQ.parse_employees(doc,url,resolve,reject);
        resolve("");
    };
    DQ.parse_team_vicimus=function(doc,url,resolve,reject) {
        console.log("In parse_team_vicimus at "+url);
        var team=doc.querySelectorAll(".staff-details"),match;
         team.forEach(function(dets) {
             var emp={name:"",title:"",phone:"",email:""};
             var term_map={".name":"name",".position":"title",".phone":"phone",".email,.email a":"email"},x,field,match;
             for(x in term_map) {
                 if((field=dets.querySelector(x))) {
                     if(term_map[x]==="email" && field.href && (match=field.href.match(/mailto:\s*(.*)$/))) emp[term_map[x]]=match[1];
                     else emp[term_map[x]]=field.innerText.trim();
                 }
             }
            DQ.employee_list.push(emp);

         });
        resolve("");
    };
    DQ.parse_team_none=function(doc,url,resolve,reject) {
        console.log("In parse_team_none at "+url);
        Gov.parse_contact_elems(doc,url,resolve,reject,"");
        DQ.employee_list=DQ.employee_list.concat(Gov.contact_list);
        var insp_promise=new Promise((resolve,reject) => {
            DQ.parse_team_dealerinspire(doc,url,resolve,reject); }).then(MTP.my_then_func);
        var promise_list=[insp_promise];
        Promise.all(promise_list).then(function(response) {
            resolve(""); });

    }
    //team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|ÉQUIPE|Personnel/i
    DQ["360"]={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel|Meet .*Family/i,team_parser:DQ.parse_team_360};

    DQ["assets-cdk"]={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_assets_cdk};
    DQ.bwebauto={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_bwebauto};
    DQ.convertus={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
               team_parser:DQ.parse_team_convertus};
    DQ.d2cmedia={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
               team_parser:DQ.parse_team_d2cmedia};
    DQ.dealer={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe/i,
               team_bad_text_rx:/(^\s*Join)|Body Shop|Collision|Finance|Parts|Service/i,
               team_parser:DQ.parse_team_dealer};
    DQ.dealercity={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_dealercity};
    DQ.dealerfire={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_dealerfire};
    DQ.dealerinspire={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_dealerinspire};
    DQ.dealerspike={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_dealerspike};
    DQ.dealeron={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_dealeron};
    DQ.dealersiteplus={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|People/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_dealersiteplus};
    DQ.drivingdealersolutions={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel|Meet .*Family/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_drivingdealersolutions};
    DQ.edealer={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel|Meet .*Family/i,
                team_bad_text_rx:/(^\s*Join)|Body Shop|Collision|Finance|Parts|Service/i,team_parser:DQ.parse_team_edealer};
    DQ.evolio={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_evolio};
    DQ["ez-results"]={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_ez_results};
    DQ.FordDirect={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_FordDirect};
    DQ.goauto={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_goauto};
    DQ.leadboxhq={team_suffix:"/resources/staff.json",team_parser:DQ.parse_team_leadboxhq};
    DQ.nakedlime={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_parser:DQ.parse_team_nakedlime};
  //  DQ.none={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,
    //           team_bad_text_rx:/(^\s*Join)|Body Shop|Collision|Finance|Parts|Service/i,
      //         team_parser:DQ.parse_team_none};
    DQ.stormdivision={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_stormdivision};
    DQ.strathcom={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_strathcom};

    DQ.vicimus={team_find_link:DQ.find_link,team_href_rx:/.*/,team_text_rx:/Staff|Team|Equipe|Personnel/i,team_bad_text_rx:/(^\s*Join)|Finance|Parts|Service/i,
                   team_parser:DQ.parse_team_vicimus};
    DQ.match_email=function(email_list,name) {
        let fullname=MTP.parse_name(name),i,j;
        let email_regexes=[new RegExp(fullname.fname.charAt(0)+fullname.lname+"@","i"),
                           new RegExp(fullname.fname.charAt(0)+"."+fullname.lname+"@","i"),
                           new RegExp(fullname.fname+fullname.lname+"@","i"),new RegExp(fullname.fname+"."+fullname.lname+"@","i"),
                           new RegExp(fullname.fname+"@","i")];
        for(i=0;i<email_list.length;i++) {
            let temp=email_list[i];
            for(j=0;j<email_regexes.length;j++) {
                if(email_regexes[j].test(temp)) {
                    return temp;
                    break; }
            }
        }
        return null;
    }
    DQ.parse_vcard=function(doc,url,resolve,reject) {
        var vcard=doc.querySelectorAll(".vcard");
        vcard.forEach(function(v) {
            var emp={name:"",title:"",email:"",phone:""},x,field;
            var term_map={".fn":"name",".title":"title",".email,[itemprop='email']":"email",".phone":"phone"};
            for(x in term_map) {
                if((field=v.querySelector(x))) {
                    //console.log("field.outerHTML="+field.outerHTML+", field.tagName="+field.tagName+", field.content="+field.content);
                    if(field.tagName==="META") emp[term_map[x]]=field.content;
                    else emp[term_map[x]]=field.innerText.trim();
                }
            }
            DQ.employee_list.push(emp);
        });
    }
    DQ.parseEmployee=function(emp) {
        var data={name:"",title:"",email:"",phone:""},match;
        var first=emp.querySelector("[itemprop='givenName']"),last=emp.querySelector("[itemprop='familyName']");
        var name=emp.querySelector("[itemprop='name']");
        var title=emp.querySelector("[itemprop='jobTitle']");
        var email=emp.querySelector("[itemprop='email']");
        if(first&&last) data.name=first.innerText.trim()+" "+last.innerText.trim();
        else if(name) data.name=name.innerText.trim();
        if(title) data.title=title.innerText.trim();
        if(email && email.href && (match=email.href.match(/mailto:\s*(.*)$/))) data.email=match[1];
        if(!data.email && (match=emp.innerHTML.match(email_re))) data.email=match[0];
        DQ.employee_list.push(data);
    };
    /* parse employee schema */
    DQ.parse_employees=function(doc,url,resolve,reject) {
        var employees=doc.querySelectorAll("[itemprop='employee']");
        employees.forEach(DQ.parseEmployee);
    }

    DQ.init_DQ=function(doc,url,resolve,reject,response) {
        var curr_page,curr_url,promise;
        //  console.log(url+", response="+JSON.stringify(response));
        //console.log("init_DQ, url="+url);
        DQ.page_type=DQ.id_page_type(doc,url,resolve,reject);
                console.log(url+": page_type="+DQ.page_type);

        if(DQ.dealer_map[DQ.page_type]) DQ.page_type=DQ.dealer_map[DQ.page_type];
                console.log(url+": page_type="+DQ.page_type);

        curr_page=DQ[DQ.page_type];
        //console.log(url+": curr_page="+JSON.stringify(curr_page));
        if(curr_page) {
            curr_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1");
            if(curr_page.team_suffix) curr_url=curr_url+curr_page.team_suffix;
            else if(curr_page.team_find_link) curr_url=curr_page.team_find_link(doc,url,resolve,reject,curr_page);
            console.log("Found team page at "+curr_url);
            if(curr_page.team_parser) promise=MTurkScript.prototype.create_promise(curr_url,curr_page.team_parser,resolve,reject);
            else {
                my_query.done_websites++;
                submit_if_done();
                return;
            }
        }
        else {
                my_query.done_websites++;
                submit_if_done();
                return;
            }



    };
    // Identify the type of page
    DQ.id_page_type=function(doc,url,resolve,reject) {
        var page_type="none",i,match,src,copyright,item,links=doc.getElementsByTagName("link");
        var thei=doc.getElementsByTagName("iframe"),twitter;
        if((match=url.match(DQ.dealer_regex)) &&
           (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
            .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type;
        for(i=0; i < doc.links.length; i++) {
            if((match=doc.links[i].href.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type;
            else if(/prontodealer\.com/i.test(doc.links[i].innerText)) return "prontodealer";
        }
        for(i=0; i < doc.scripts.length; i++) {
            // if(doc.scripts[i].src) console.log("doc.scripts["+i+"].src="+doc.scripts[i].src);
            if(doc.scripts[i].src && (match=doc.scripts[i].src.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\.[^\.]*$/,"").toLowerCase().replace(/\//g,"")
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }
        for(i=0; i < links.length; i++) {
            if(links[i].href && (match=links[i].href.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }
        for(i=0; i < thei.length; i++) {
            if(thei[i].src && (match=thei[i].src.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }
        if((copyright=doc.getElementsByClassName("copyrightProvider")).length>0
           && /FordDirect|DealerDirect/.test(copyright[0].innerText)) return "FordDirect";
        if((copyright=doc.getElementById("footer-copyright")) &&
           /FordDirect|DealerDirect/i.test(copyright.innerText)) return "FordDirect";
         if((copyright=doc.querySelector(".legal")) &&
           /FordDirect|DealerDirect/i.test(copyright.innerText)) return "FordDirect";
        copyright=doc.querySelectorAll("footer");
        for(i=0;i<copyright.length;i++) {
            if(/FordDirect|DealerDirect/i.test(copyright[i].innerText)) return "FordDirect";
            else if(/Driving Dealer Solutions/i.test(copyright[i].innerText)) return "drivingdealersolutions";
        }
        if((copyright=doc.getElementsByName("copyright")).length>0
           && /^AutoCorner/i.test(copyright[0].content)) return "autocorner";
        if((copyright=doc.getElementsByClassName("copyright-wrap")).length>0 &&
           /InterActive DMS/.test(copyright[0].innerText)) return "interactivedms";
        if(doc.querySelector(".legacy-redirect")) return "waynereaves";
        if((twitter=doc.getElementsByName("twitter:creator")[0]) && twitter.content==="@leadbox") return "leadboxhq";
        if(/\.hasyourcar\./.test(url)) return "hasyourcar";
        return page_type;
    };
    function is_bad_name(b_name,b_url,p_caption)  {
        console.log("my_query.short_name="+my_query.short_name);

        var no_space_name=my_query.short_name.replace(/[\s\-\.\,\']*/g,"").toLowerCase();
        var domain=MTP.get_domain_only(b_url,true).toLowerCase().replace(/\..*$/,"");

        if(MTP.removeDiacritics(b_name).toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1) return false;
        if(MTP.removeDiacritics(b_name).toLowerCase().
           indexOf(my_query.short_name.replace(/St([^A-Za-z])/,"Saint$1").toLowerCase())!==-1) return false;
        if(domain.indexOf(no_space_name)!==-1 || no_space_name.indexOf(domain)!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(my_query.fields.phone.length===0 && parsed_context.Phone) my_query.fields.phone=parsed_context.Phone;
            if(parsed_context.url && (resolve(parsed_context.url)||true)) return;
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(my_query.fields.phone.length===0 && parsed_lgb.phone) my_query.fields.phone=parsed_lgb.phone;
                if(parsed_lgb.url && !/mturkcontent/.test(parsed_lgb.url) && (resolve(parsed_lgb.url)||true)) return;
            }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name,b_url,p_caption) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.try_count===0) {
            my_query.try_count++;
            let search_str=my_query.fields.dealershipName+" "+my_query.fields.city+" "+my_query.fields.province;;
            query_search(search_str,resolve,reject,query_response,"query");
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }
    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("query_promise_then,result="+result);

        result=result.replace(/(https?:\/\/[^\/]*).*$/,"$1");
       if(result!==my_query.url) {
           my_query.fields.dealershipWebsite=result;
           add_to_sheet();
             my_query.done.query=true;
            var promise=MTP.create_promise(result,DQ.init_DQ,init_dealer_then,function() {
                my_query.done_websites++; submit_if_done(); });
        }
        else {
            console.log("doing done query equals");
            my_query.done.query=true;
            my_query.done_websites++;
            submit_if_done(); }

    }
    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Gov!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }
    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x,is_good_fields=false,i;
        var fieldnames=["dealerPrincipalName","generalManagerName","newCarManagerName","usedCarManagerName"];
        if(my_query.done_websites>=2) my_query.done.website=true;
        console.log("my_query.done="+JSON.stringify(my_query.done)+", "+my_query.done_websites);
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        for(i=0;i<fieldnames.length;i++) {
            if(my_query.fields[fieldnames[i]].length>0) is_good_fields=true; }

        if(is_done && is_good_fields && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done) {
            console.log("No fields added, returning");
            GM_setValue("returnHit",true);
        }
    }
    function paste_name(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var ret=Gov.parse_data_func(text),field;
        console.log("ret="+JSON.stringify(ret));
        e.target.value=text;
        let email=document.getElementsByName(e.target.name.replace(/Name$/,"Email"))[0];
        if(ret&&ret.name) e.target.value=ret.name;
        if(ret&&ret.email) email.value=ret.email;
        for(x of my_query.fields.name_list) {
            field=document.getElementsByName(x);
            my_query.fields[x]=field.value.trim();
        }
        add_to_sheet();
    }
    /* Add TYPE of query e.g. what we want to scrape */
    function init_dealer_site(doc,url,resolve,reject) {
        var curr_page,curr_url,promise;
        //  console.log(url+", response="+JSON.stringify(response));
        //console.log("init_DQ, url="+url);
        DQ.page_type=DQ.id_page_type(doc,url,resolve,reject);
        if(DQ.dealer_map[DQ.page_type]) DQ.page_type=DQ.dealer_map[DQ.page_type];
        console.log(url+": page_type="+DQ.page_type);
        curr_page=DQ[DQ.page_type];
    }
    function init_dealer_then(result) {
        my_query.done_websites+=1;
        if(my_query.done_websites>=2) my_query.done.website=true;
        //console.log("employees="+JSON.stringify(DQ.employee_list));
        add_employees();

    }
    function add_employee(emp) {
        console.log("employee to add="+JSON.stringify(emp));
        if(/(Dealer Principal|Owner|President|Principal|Director of Operations|Managing Partner|Proprietaire)/i.test(MTP.removeDiacritics(emp.title))
           && my_query.fields.dealerPrincipalName.length===0) {
            console.log("Added principal");
            my_query.fields.dealerPrincipalName=emp.name.replace(/\n/g," ");
            my_query.fields.dealerPrincipalEmail=emp.email; }
        if(/(General Manager)|General Sales Manager|(Directeur|Directrice) Général/i.test(emp.title)) {
                        console.log("Added GM");

            my_query.fields.generalManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.generalManagerEmail=emp.email; }
        else if(/New\s.*(Administrator|Director|Manager)|(Directeur\s.*neuf)/i.test(emp.title)) {
            console.log("Added New");

            my_query.fields.newCarManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.newCarManagerEmail=emp.email; }
         else if(/New Sales|\sneuf/i.test(emp.title) && my_query.fields.newCarManagerName.length===0) {
            console.log("Added New");

            my_query.fields.newCarManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.newCarManagerEmail=emp.email; }
        else if(/(Used|Pre(-)?Owned)\s.*(Administrator|Director|Manager)|d\'occasions/i.test(emp.title)) {
            console.log("Added Used");

            my_query.fields.usedCarManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.usedCarManagerEmail=emp.email; }
        else if(/(Used|Pre(-)?Owned)/i.test(emp.title) && my_query.fields.usedCarManagerName.length===0) {
            console.log("Added Used");

            my_query.fields.usedCarManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.usedCarManagerEmail=emp.email; }
        else if(/Sales .*(Administrator|Director|Manager)|((Directeur|Directrice) des ventes)|Sales/i.test(emp.title) && my_query.fields.generalManagerName.length===0) {
            my_query.fields.generalManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.generalManagerEmail=emp.email; }
        else if(/Sales .*(Administrator|Director|Manager)|((Directeur|Directrice) des ventes)|Sales/i.test(emp.title) && my_query.fields.generalManagerName.length>0 &&
               my_query.fields.newCarManagerName.length===0) {
            my_query.fields.newCarManagerName=emp.name.replace(/\n/g," ");
            my_query.fields.newCarManagerEmail=emp.email; }

    }

    function add_employees() {
        var emp;
        for(emp of DQ.employee_list) {
            add_employee(emp); }
        if(my_query.fields.generalManagerName.length===0 && my_query.fields.dealerPrincipalName.length===0) {
            var i=0;
            while(i<DQ.employee_list.length && (DQ.employee_list[i].name.length===0||DQ.employee_list[i].email.length===0)) i++;
            console.log("i="+i);
            if(i<DQ.employee_list.length) {

                my_query.fields.generalManagerName=DQ.employee_list[i].name;
                my_query.fields.generalManagerEmail=DQ.employee_list[i].email;
            }
        }
        submit_if_done();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i,x,name_list=[];
        document.querySelectorAll("crowd-input").forEach(function(elem) { name_list.push(elem.name); });
        console.log("name_list="+JSON.stringify(name_list));
        var fieldnames=["dealerPrincipalName","generalManagerName","newCarManagerName","usedCarManagerName"];
        var url=document.querySelector("form a")?document.querySelector("form a").href:"";
        if(/mturk/.test(url)) url="";

        for(x of fieldnames) document.getElementsByName(x)[0].addEventListener("paste",paste_name);




        my_query={url:url,fields:{},done:{"query":false,"website":false},done_websites:0,employee_list:[],
                  submitted:false,name_list:name_list,try_count:0};
        for(x of name_list) my_query.fields[x]=document.getElementsByName(x)[0].value;

        console.log("my_query="+JSON.stringify(my_query));
        my_query.short_name=MTP.shorten_company_name(my_query.fields.dealershipName);
        my_query.short_name=MTP.removeDiacritics(my_query.short_name.replace(new RegExp("\\s*"+my_query.fields.city+"$","i"),""));
        var search_str=my_query.fields.dealershipName+" "+my_query.fields.streetAddress+" "+my_query.fields.city+" "+my_query.fields.province;
        if(my_query.url.length>0) {
            var promise=MTP.create_promise(my_query.url,DQ.init_DQ,init_dealer_then,function() {
                console.log("FAILED TO LOAD "+url);
                my_query.done_websites++;
                submit_if_done(); } );
        }
        else {
            console.log("NO URL FOUND initially");
            my_query.done_websites++;
            submit_if_done();
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; my_query.done_websites++; submit_if_done(); });
    }

})();