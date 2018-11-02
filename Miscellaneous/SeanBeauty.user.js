// ==UserScript==
// @name         SeanBeauty
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Sean Beauty Ingredients Search
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
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @connect sephora.com
// @connect ulta.com
// @connect dermstore.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    var try_urls=["makeupalley.com","ulta.com","skincarerx.com","cosdna.com","skinsafeproducts.com","drugs.com"
                  ,"skincarisma.com","walgreens.com"];//,"beautybridge.com","sephora.com","beautyhabit.com"];
    var try_parsers=[parse_makeupalley,parse_ulta,parse_skincarerx,parse_cosdna,parse_skinsafe,parse_drugs
                     ,parse_skincarisma,parse_walgreens];//,parse_beautybridge,parse_sephora,parse_beautyhabit];
    var url_parsers={"burtsbees.com":parse_burtsbees,"cledepeaubeaute.com":parse_cle,
                    "elizabetharden.com":parse_arden,"clarksbotanicals.com":parse_clarks,
                    "baxterofcalifornia.com":parse_baxter,"billyjealousy.com":parse_billyjealousy,
                    "chantecaille.com":parse_chantecaille,"clinique.com":parse_clinique,"clarins.co.uk":parse_clarins,
                    "christiebrinkleyauthenticskincare.com":parse_christiebrinkley,"h2oplus.com":parse_h2oplus,
                    "guerlain.com":parse_guerlain,"benefitcosmetics.com":parse_benefit,"skinandcoroma.com":parse_billyjealousy,
                    "grandecosmetics.com":parse_grande,"colbertmd.com":parse_colbert,"ernolaszlo.com":parse_laszlo,
                    "naturabisse.com":parse_naturabisse,"origins.com":parse_origins,"osmotics.com":parse_naturabisse,
                    "bigelowtrading.com":parse_bigelow,"nursejamie.com":parse_idingredients,"profile4men.com":parse_profile,
                    "toocoolforschool.us":parse_toocool,"shiseido.com":parse_shiseido,"tula.com":parse_tula,
                    "starskin.com":parse_starskin,"reviveskincare.com":parse_beautyhabit,"shop.trustthebum.com":parse_sunbum,"lancome-usa.com":parse_baxter,
                    "strivectin.com":parse_strivectin,"differin.com":parse_idingredients,"avon.com":parse_avon};
    var company_map={"Clarins":{reg:/^CLARINS /}, "Clarisonic":{reg:/^CLARISONIC /},
                     "Baxter":{reg:/^BAXTER /,dom:"baxterofcalifornia.com"},
                    "Elizabeth Arden":{reg:/^ARDEN /,dom:"elizabetharden.com"},
                     "Billy Jealousy":{reg:/^BILLY JEALOUSY /,dom:"billyjealousy.com"},"Chantecaille":{reg:/^CHANTECAILLE /,dom:"chantecaille.com"},
                    "Clinique":{reg:/^CLINIQUE /,dom:"clinique.com"},"Clarins":{reg:/^CLARINS /,dom:"clarins.co.uk"},
                    "Christie Brinkley":{reg:/^CHRISTIE BRINKLEY/,dom:"christiebrinkleyauthenticskincare.com"},
                    "Bliss":{reg:/^BLISS /},"Armani":{reg:/^ARMANI /}, "Beauty Bioscience":{reg:/^BEAUTY BIOSCIENCE /},
                    "Chanel":{reg:/^CHANEL /},"Guerlain":{reg:/^GUERLAIN /,dom:"guerlain.com"},"SK-II":{reg:/^SKII /},
                    "Benefit":{reg:/^BENEFIT /,dom:"benefitcosmetics.com"},"Skin and Co Roma":{reg:/^SKIN & CO ROMA/,dom:"skinandcoroma.com"},
                    "By Terry":{reg:/^BY TERRY /},"H2O Plus":{reg:/^H2O PLUS /,dom:"h2oplus.com"},
                    "Grande":{reg:/^GRANDE(\s|[A-Z]+)/,dom:"grandecosmetics.com"},"Colbert MD":{reg:/^COLBERT MD /,dom:"colbertmd.com"},
                     "Erno Laszlo":{reg:/^E\. LASZLO /,dom:"ernolaszlo.com"},"Natura Bisse":{reg:/^NATURA BISSE /,dom:"naturabisse.com"},
                     "Mario Badescu":{reg:/^MARIO BADESCU /},"Origins":{reg:/ORIGINS /,dom:"origins.com"},"Osmotics":{reg:/^OSMOTICS /,dom:"osmotics.com"},
                     "Proraso":{reg:/^PRORASO /,dom:"bigelowtrading.com"},"Nurse Jamie":{reg:/^NURSE JAMIE /,dom:"nursejamie.com"},
                     "Profile":{reg:/^PROFILE /,dom:"profile4men.com"},"Max in Pocket":{reg:/^MAX IN POCKET /,dom:"toocoolforschool.us"},
                     "Shiseido":{reg:/^SHISEIDO /,dom:"shiseido.com"},"Malin + Goetz":{reg:/^MALIN \+ GOETZ /},"Tula":{reg:/^TULA /,dom:"tula.com"},
                     "Starskin":{reg:/^STARSKIN /,dom:"starskin.com"},"Re Vive":{reg:/^RE VIVE /,dom:"reviveskincare.com"},
                     "Sun Bum":{reg:/^SUN BUM /,dom:"shop.trustthebum.com"},"Strivectin":{reg:/^STRIVECTIN(\s|-)/,dom:"strivectin.com"},
                     "Lancome":{reg:/^LANCOME /i,dom:"lancome-usa.com"},"Differin":{reg:/^DIFFERIN /i,dom:"differin.com"},
                     "Befine":{reg:/^BE FINE /i},"Avon":{reg:/^AVON /,dom:"avon.com"},"Bull Frog":{reg:/^BULLFROG/i},
                     "Burt's Bees":{reg:/^BURTS BEES/i,dom:"burtsbees.com"},"Banana Boat":{reg:/^BANANA BT /},"Dairyface":{reg:/^DAIRYFACE /}

                    };

    function check_function()
    {
	return true;
    }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;

        var shortened_name=my_query.name;
     //   console.log("company_map[my_query.company_name]="+JSON.stringify(company_map[my_query.company_name].regex));
        if(company_map[my_query.company_name]!==undefined && company_map[my_query.company_name].reg!==undefined)
        {
           // console.log("company_map[my_query.company_name].regex="+company_map[my_query.company_name].reg);
            shortened_name=shortened_name.replace(company_map[my_query.company_name].reg,"").trim();
        }
        else
        {
            my_query.company_name=shortened_name.match(/^[A-Z]+/);

            shortened_name=shortened_name.replace(/^[A-Z]+\s/," ").trim();
        }
        console.log("shortened_name="+shortened_name);
        var first_in_shortened="";
        try
        {
            first_in_shortened=shortened_name.match(/^([^\s]+)\s/)[1].replace(/\//g,"-");
        }
        catch(error) { console.log("error="+error); }
          var first_regex=new RegExp(first_in_shortened,"i");

        var company_regex=new RegExp(my_query.company_name,"i");

        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
     
            for(i=0; i < b_algo.length && i < 3; i++)
            {
                console.log("i="+i);
                b_name=removeDiacritics(b_algo[i].getElementsByTagName("a")[0].textContent.replace(/ & /," and "));
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		//b_caption=b_algo[i].getElementsByClassName("b_caption");//[0].innerText;
                console.log("response:("+i+"): name="+b_name+", url="+b_url);



                if(!/community\.sephora\.com\//.test(b_url) && company_regex.test(b_name) && is_good_url(b_url,b_name))// && first_regex.test(b_name.replace(/\//g,"-")))
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
            resolve(b_url);
            return;
	    }
           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.try_count < try_urls.length-1)
        {
            my_query.try_count++;
            let search_str=my_query.name +" site:"+try_urls[my_query.try_count];
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    function is_good_url(b_url,b_name)
    {
        if(my_query.url==="billyjealousy.com" && b_url.indexOf("billyjealousy.com/collections/")!==-1) return false;
        if(my_query.url==="cledepeaubeaute.com" && b_url.indexOf(".html")===-1) return false;
        if(my_query.url==="clinique.com" && b_url.indexOf("/product/")===-1) return false;
        if(my_query.url==="burtsbees.com" && b_url.indexOf("/product/")===-1) return false;
        if(my_query.url==="h2oplus.com" && (b_url.indexOf("/face/collections/")!==-1 || b_url.indexOf("/face/products/")!==-1)) return false;
        if(b_url.indexOf("walgreens.com/q/")!==-1) { return false; }
      //  if(/https?:\/\/[^\/]+\/?$/.test(my_query.url)) return false;
        return true;
    }

    /* For queries for a specific url */
    function query_response2(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;

        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 2; i++)
            {
                console.log("i="+i);
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_url=b_url.replace(/^https?:\/\/m\./,"https://www.");
		//b_caption=b_algo[i].getElementsByClassName("b_caption");//[0].innerText;
                console.log("("+i+"): name="+b_name+", url="+b_url);



                if(!/community\.sephora\.com\//.test(b_url) && is_good_url(b_url,b_name))
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
            resolve(b_url);
            return;
	    }


        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.try_count < try_urls.length-1)
        {
            my_query.try_count=0;
            let search_str=my_query.name +" site:"+try_urls[my_query.try_count];
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        var i;
        if(/skincarisma\.com/.test(url))
        {
            url=url.replace(/\/$/,"")+"/ingredient_list";
        }

        const parsePromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { try_parsers[my_query.try_count](response,resolve,reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
        });
        parsePromise.then(parse_promise_then)
        .catch(function(val) { my_query.try_count++; parse_promise_fail(val); });


    }

    /* If a promise has failed for specific site */
    function parse_promise_fail(val)
    {
        console.log("Failed parse_promise "+val);

        console.log("Trying again with ");
        let search_str=my_query.name +" site:"+try_urls[my_query.try_count];
        console.log("Trying again with "+search_str);
        if(my_query.try_count<try_urls.length)
        {
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then
                             )
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val);
                /*   if(my_query.try_count < try_urls.length-1)
                                      {
                                          my_query.try_count=0;
                                          let search_str=my_query.name +" site:"+try_urls[my_query.try_count];
                                          query_search(search_str, resolve, reject, query_response);
                                          return;
                                      }*/


            GM_setValue("returnHit",true); });
        }
        else
        {
            console.log("Too many tries");
            GM_setValue("returnHit",true);
        }
    }

    /* If there is a url */
    function query_promise2_then(url) {
        console.log("In query_promise2_then "+url);
        var i, cle_match, cle_regex=/\/([^\/\.]+)\.html/,shiseido_match,shiseido_regex=/\-([^\/\.\-]+)\.html/;
        if(my_query.url==="cledepeaubeaute.com")
        {
            cle_match=url.match(cle_regex);
            console.log("cle de peau "+cle_match[1]);

            if(cle_match!==null)
            {
                url="https://www.cledepeaubeaute.com/learn-more-ingredients-"+cle_match[1]+".html";
                console.log("url="+url);
            }

        }
        else if(my_query.url==="shiseido.com")
        {
            shiseido_match=url.match(shiseido_regex);
            console.log("shiseido "+shiseido_match[1]);

            if(shiseido_match!==null)
            {
                url="https://www.shiseido.com/"+shiseido_match[1]+"-full-ingredients.html";
                console.log("shiseido url="+url);
            }

        }


        const parsePromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) {
                if(my_query.url.length>0)
                {
                    url_parsers[my_query.url](response,resolve,reject);
                }
                else
                {

                    try_parsers[my_query.try_count](response,resolve,reject);
                }
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
        });
        parsePromise.then(parse_promise_then)
            .catch(function(val) { console.log("Failed parse_promise "+val);
                                  my_query.try_count=0;
                                  console.log("Trying again with ");
                                  let search_str=my_query.name +" site:"+try_urls[my_query.try_count];
                                  console.log("Trying again with "+search_str);
                                  const queryPromise = new Promise((resolve, reject) => {
                                      console.log("Beginning URL search");
                                      query_search(search_str, resolve, reject, query_response);
                                  });
                                  queryPromise.then(query_promise_then
                                                   )
                                      .catch(function(val) {
                                      console.log("Failed at this queryPromise " + val);
                                   /*   if(my_query.try_count < try_urls.length-1)
                                      {
                                          my_query.try_count=0;
                                          let search_str=my_query.name +" site:"+try_urls[my_query.try_count];
                                          query_search(search_str, resolve, reject, query_response);
                                          return;
                                      }*/
                                       GM_setValue("returnHit",true); });


                                 });


    }

    function parse_promise_then(val)
    {
        console.log("In parse_promise_then, val="+val);

        var i;
        val=val.replace("Your browser's Javascript functionality is turned off. Please turn it on so that you can experience the full capabilities of this site.","").trim();
     // for(i=0; i < val.length; i++) { console.log("val.charAt("+i+")="+val.charAt(i)+", code="+val.charCodeAt(i)); }
         val=val.replace(/\s*\[\]\s*/g,",").replace(/\s*･\s*/g,",").replace(/\s+\*\s+/g,",").replace(/\s*•\s*/g,",");

        val=val.replace(/\\[^,]+/g,"").replace(/\s+-\s+/g,",").replace(/\s+\uFFFD\s+/g,",");
        while(/,\s*,/.test(val))
        {
            val=val.replace(/,\s*,/g,",");
        }
        val=val.replace(/^[^:,]+:\s*/,"");
        val=val.replace(/\s*inactive ingredients:\s*/i,", ").replace(/\s*active ingredients:\s*/i,"");
        val=val.replace(/\s*other ingredients:\s*/i,", ");
        val=val.replace(/^Ingredients:?/,"");
        document.getElementById("text").value=val;
        if(document.getElementById("text").value.length===0) document.getElementById("text").value="N/A";
        check_and_submit(check_function,automate);
    }

    function parse_clarks(response,resolve,reject)
    {
       var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_clarks\n"+response.finalUrl);
        var inline=doc.getElementById("inline_content"),inner_p,inner_text;
        var i,j;
        if(inline!==null)
        {
            console.log("inline="+inline);
            inner_p=inline.getElementsByTagName("p");
            if(inner_p.length>0)
            {
                inner_text=inner_p[0].innerText;
                inner_text=inner_text.replace(/\u2028/g,",");
                console.log("inner_text="+inner_text);
            /*    for(i=0; i < inner_text.length; i++)
                {
                    console.log("inner_text.charCodeAt("+i+")="+inner_text.charCodeAt(i)+", "+inner_text.charAt(i));
                }*/
                resolve(inner_text);

                return;
            }
        }
        reject("Failed parse_clarks");

    }

    function parse_arden(response,resolve,reject)
    {
       var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_arden\n"+response.finalUrl);
        var more=doc.getElementsByClassName("more-ingredients");
        var url="";
        if(more.length>0)
        {
            let url_part=more[0].dataset.contentid;
            url="https://www.elizabetharden.com/"+url_part+".html?format=ajax";
            GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { parse_arden2(response,resolve,reject);

            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
            return;


        }
        reject("Failed arden");

    }

    function parse_arden2(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_arden2\n"+response.finalUrl);
        var content=doc.getElementsByClassName("content-asset");
        if(content.length>0)
        {
            resolve(content[0].innerText);
            return;
        }
        reject("Failed arden2");
    }


    function parse_cle(response,resolve,reject)
    {
       var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_cle\n"+response.finalUrl);
        var content=doc.getElementsByClassName("content"),url;
        if(content.length>0)
        {
             resolve(content[0].innerText);
            return;
        }
        else if(/^Page Not Found/.test(doc.title) && !my_query.doneCle)
        {
            my_query.doneCle=true;
            url=response.finalUrl.replace(/\-ingredients/,"");
            GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { parse_cle(response,resolve,reject); },
                               onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
                              });
            return;


        }
        reject("Failed parse_cle");
    }

    function parse_burtsbees(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_burtsbees\n"+response.finalUrl);
        var key=doc.getElementsByClassName("key-ingredient-popup");
        var ing=doc.getElementsByClassName("ingredient-description");
        if(key.length>0)
        {
            resolve(key[0].innerText.replace(/^Ingredients:\s*/,""));
            return;
        }
        else if(ing.length>0)
        {
            resolve(ing[0].innerText.trim());
            return;
        }
        reject("Failed burt");


    }

    function parse_bobbibrown(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_bobbibrown\n"+response.finalUrl);
        var how=doc.getElementsByClassName("how-to-use__content"),i;
        var result_text;
        var result;
        for(i=0; i < how.length; i++)
        {
            if(/Ingredients:/.test(how[i].innerText))
            {
                result_text=how[i].innerText.match(/Ingredients:(.*)/);
                if(result_text===null)
                {
                    console.log("result_Text=null"+/Ingredients:/.test(how[i].innerText));
                }
                result=result_text[1].replace(/Please be aware that.*$/,"");
                resolve(result_text[1]);
                return;
            }
        }
    }

    function parse_baxter(response,resolve,reject)
    {
       var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_baxter\n"+response.finalUrl);
        var ing=doc.getElementById("tab_ingredients");
        if(ing) { resolve(ing.innerText.trim().replace(/^Print\s*/,"").trim()); return; }
        else { reject("Failed baxter"); }
    }

    function parse_billyjealousy(response,resolve,reject)
    {
       var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_billyjealousy\n"+response.finalUrl);
        var rte=doc.getElementsByClassName("rte");
        if(rte.length>0) { resolve(rte[rte.length-1].innerText.trim()); return; }
        else { reject("Failed billyjealousy"); }
    }

    function parse_chantecaille(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_chantecaille\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("ingredients"),content;
        if(ing.length>0)
        {
            content=ing[0].getElementsByClassName("content");
            if(content.length>0)
            {
                resolve(content[0].innerText.trim());
                return;
            }
        }
        reject("Failed chantecaille");
    }

    function parse_clinique(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_clinique\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("product-full__ingredients-sub__copy");
        var ing_content=doc.getElementsByClassName("ingredients_content"),i,scripts, page_data,x;
        var y,z;
        if(ing.length>0)
        {
            resolve(ing[0].innerText.trim());
            return;
        }
        else if(ing_content.length>0)
        {
             resolve(ing_content[0].innerText.trim());
            return;
        }
        else
        {
            scripts=doc.scripts;
            for(i=0; i < scripts.length; i++)
            {
               // console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
                if(/^var page_data/.test(scripts[i].innerHTML))
                {
                    page_data=JSON.parse(scripts[i].innerHTML.replace(/^var page_data\s*\=\s*/,""));
         //           console.log(page_data["catalog-spp"]["products"][0]["defaultSku"]["ILN_LISTING"]);
                    try
                    {
                        resolve(page_data["catalog-spp"]["products"][0]["defaultSku"]["ILN_LISTING"]);
                        return;
                    }
                    catch(error) { console.log("error = "+error); }
                    //console.log("page_data="+JSON.stringify(page_data));
                }
            }
        }
        reject("Failed parse_clinique");
    }

    function parse_clarins(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_clarins\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("ingredients-details"),full;
        if(ing.length>0)
        {
            full=ing[0].getElementsByClassName("details-text-full");
            if(full.length>0)
            {
                resolve(full[0].innerText.trim());
                return;
            }
        }
        reject("Failed clarins");
    }

    function parse_christiebrinkley(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_christiebrinkley\n"+response.finalUrl);
        var ing=doc.getElementById("yt_tab_ingredients"),inner_p,i;
        if(ing)
        {
            console.log("Found ing");
            inner_p=ing.getElementsByTagName("p");
            for(i=0; i < inner_p.length; i++)
            {
                console.log("inner_p["+i+"].innerText="+inner_p[i].innerText);
                if(/^Ingredients:/.test(inner_p[i].innerText.trim()))
                {

                    resolve(inner_p[i].innerText.trim());
                    return;
                }
            }
        }
        reject("Failed christie brinkley");
    }

     function parse_guerlain(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_guerlain\n"+response.finalUrl);
        var ing=doc.getElementById("ingredients-popup"),inner_p,i;
        if(ing)
        {
            console.log("Found ing");

            resolve(ing.innerText.trim());
            return;


        }
        reject("Failed guerlain");
    }

    function parse_benefit(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_benefit\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("field-name-field-ingredients"),inner_p,i;
        if(ing.length>0)
        {
            console.log("Found ing");

            resolve(ing[0].innerText.trim());
            return;


        }
        reject("Failed benefit");
    }
    function parse_h2oplus(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_h2oplus\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("all-ingredients"),value,i;
        if(ing.length>0)
        {
            console.log("Found ing");
            value=ing[0].getElementsByClassName("value")
            if(value.length>0)
            {
                resolve(value[0].innerText.trim());
                return;
            }


        }
        reject("Failed h2oplus");
    }

    function parse_grande(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_grande\n"+response.finalUrl);
        var ing=doc.getElementById("ProductDetail_TechSpecs_div");
        if(ing)
        {
            console.log("Found ing");

            resolve(ing.innerText.trim());
            return;
        }
        reject("Failed grande");
    }

    function parse_colbert(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_colbert\n"+response.finalUrl);
        var panel=doc.getElementsByClassName("panel-body");
        var inner_text;
        if(panel.length>0)
        {
           var inner_div=panel[0].getElementsByTagName("div");
            if(inner_div.length>0)
            {
                inner_text=inner_div[0].innerText.trim();
               // console.log("inner_text="+inner_text);

                inner_text=inner_text.replace(/PRECAUTIONS FOR USE:.*$/g,"").trim();
                //console.log("inner_text="+inner_text);
                resolve(inner_text);
                return;
            }
        }
        reject("Failed parse_colbert");
    }

     function parse_laszlo(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_laszlo\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("ingredients");
        var inner_text;
        if(ing.length>0)
        {
            inner_text=ing[0].innerText;
            inner_text=inner_text.replace(/^[^:]+:/,"").trim();
            resolve(inner_text);
        }
        reject("Failed parse_laszlo");
    }

    function parse_naturabisse(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_naturabisse\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("ingredients");
        var inner_text;
        if(ing.length>0)
        {
            inner_text=ing[0].innerText;
            inner_text=inner_text.replace(/^[^:]+:/,"").trim();
            resolve(inner_text);
            return;
        }
        reject("Failed parse_naturabisse");
    }

    function parse_origins(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_origins\n"+response.finalUrl);
        var content=doc.getElementsByClassName("product-full__tabbed-content"),i,text;
        for(i=0; i < content.length; i++) {
            console.log("content="+JSON.stringify(content[i].dataset));
            if(content[i].dataset.tabContent==="ingredients")
            {
                text=content[i].innerText.trim().replace(/Please be aware.*$/,"").trim();
                console.log("text="+text);
                resolve(text.replace(/\s{2,}.*$/,""));
                return;
            }
        }
        reject("Failed parse_origins");
    }
    function parse_bigelow(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_origins\n"+response.finalUrl);
        var col=doc.getElementsByClassName("col"),i,text,inner_p;
        for(i=0; i < col.length; i++) {

            if(/INGREDIENTS/.test(col[i].innerText))
            {
                inner_p=col[i].getElementsByTagName("p");
                if(inner_p.length>0)
                {

                    resolve(inner_p[0].innerText.trim());
                    return;
                }
            }
        }
        reject("Failed parse_origins");
    }
    function parse_idingredients(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_idingredients\n"+response.finalUrl);
        var ing=doc.getElementById("ingredients");

        if(ing)
        {

            resolve(ing.innerText.trim());
            return;
        }
        reject("Failed parse_idingredients");
    }

    function parse_profile(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_profile\n"+response.finalUrl);
        var ing=doc.getElementById("tab-ingredients"),inner_p;

        if(ing)
        {
            inner_p=ing.getElementsByTagName("p");
            if(inner_p.length>0)
            {
                resolve(inner_p[0].innerText.trim());
                return;
            }
        }
        reject("Failed parse_profile");
    }

    function parse_toocool(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_toocool\n"+response.finalUrl);
        var container=doc.getElementsByClassName("info-container"),i;
        for(i=0; i < container.length; i++)
        {
            if(container[i].getElementsByClassName("info-container__category").length>0 &&
               /Ingredients/.test(container[i].getElementsByClassName("info-container__category")[0].innerText))
            {
                resolve(container[i].getElementsByClassName("info-container__description")[0].innerText.trim());
                return;
            }

        }

        reject("Failed parse_toocool");
    }

    function parse_shiseido(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_shiseido\n"+response.finalUrl);
        var main=doc.getElementById("main");
        if(main) {
                resolve(main.innerText.trim());
                return;
            }
        reject("Failed parse_shiseido");
    }

    function parse_tula(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_tula\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("full_ingredient");
        if(ing.length>0) {
                resolve(ing[0].innerText.trim());
                return;
            }
        reject("Failed parse_tula");
    }

    function parse_starskin(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_starskin\n"+response.finalUrl);
        var ing=doc.getElementById("ContentSpec_02"),inner_p;
        if(ing) {
            if(/Ingredients/i.test(ing.innerText) && ing.getElementsByTagName("p").length>0)
            {

                resolve(ing.getElementsByTagName("p")[0].innerText.trim());
                return;
            }
        }
        reject("Failed parse_starskin");
    }
    function parse_strivectin(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_strivcetin\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("ingredients-text"),inner_p;
        if(ing.length>0) {

            resolve(ing[0].innerText.trim());
            return;

        }
        reject("Failed parse_strivectin");
    }

    function parse_sunbum(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_sunbum\n"+response.finalUrl);
        var accordion=doc.getElementsByClassName("ttb-radio-accordian"),i,j;
        if(accordion.length==0) { reject("Failed parse_sunbum"); return }
        accordion=accordion[0];
        var children=accordion.children,inner_p;
        for(i=0; i < children.length; i++)
        {
            console.log("children["+i+"].tagName="+children[i].tagName+", children["+i+"].innerText="+children[i].innerText.trim());
            if(children[i].tagName==="DIV" && /^Description/.test(children[i].innerText.trim()) && i < children.length-1)
            {
                inner_p=children[i+1].getElementsByTagName("p");
                if(inner_p.length>0)
                {
                    resolve(inner_p[inner_p.length-1].innerText.trim());
                    return;
                }
            }

        }

        reject("Failed parse_sunbum");
    }




    function parse_makeupalley(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_makeupalley\n"+response.finalUrl);
        var i;
        var hold=doc.getElementById("hold-ingredients");
        if(hold!==null && hold.innerText.trim().length>0)
        {
            resolve(hold.innerText.trim());
            return;
        }


        reject("Failed MakeupAlley");

    }

    function parse_beautybridge(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_beautybridge\n"+response.finalUrl);
        var i;
        var ing=doc.getElementsByClassName("ingredients");
        if(ing.length>0)
        {
            for(i=0; i < ing.length; i++)
            {
                if(ing[i].tagName==="DIV" && ing[i].innerText.trim().length>0)
                {
                    resolve(ing[i].innerText.trim());
                    return;
                }
            }
        }


        reject("Failed beautybridge");

    }

    function parse_skincarerx(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_skincarerx\n"+response.finalUrl);
        var more=doc.getElementsByClassName("product-more-details"),table,i,curr_row,result,inner_p;
        if(more.length>0)
        {
            table=more[0].getElementsByTagName("table");
            if(table.length===0) reject("Failed skincarex");
            table=table[0];
            for(i=0; i < table.rows.length; i++)
            {
                curr_row=table.rows[i];
                if(/Ingredients:/.test(curr_row.cells[0].innerText))
                {
                    inner_p=curr_row.cells[1].getElementsByTagName("p");

                    result=inner_p[inner_p.length-1].innerText.trim();
                    console.log("BLOO "+result);
                  //  result=result.replace(/^[^\n]/,"");//.replace(/\s*Key Ingredients:\s*/,"");
                    resolve(result);
                    return;
                }
            }
        }
        reject("Failed skincarex");
    }

    function parse_sephora(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_sephora\n"+response.finalUrl);
        var i;
        var curr_tab, curr_tabpanel;
        var success=false,result="";
        for(i=0; i < 10; i++)
        {
            console.log("i="+i);
            if(doc.getElementById("tab"+i)===null) break;
            curr_tab=doc.getElementById("tab"+i);
            if(/Ingredients/i.test(curr_tab.innerText))
            {
                curr_tabpanel=doc.getElementById("tabpanel"+i);
                if(curr_tabpanel)
                {
                    success=true;
                    break;
                }
            }
        }
        if(success)
        {
            result=curr_tabpanel.innerText;
            while(/^\s*-([^\n]+)/.test(result)) { result=result.replace(/^\s*-([^\n]+)/,"").trim(); }
            resolve(result);
            return;
        }
        reject("Failed Sephora");

    }

    
    function parse_ulta(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_ulta\n"+response.finalUrl);
        var ing=doc.getElementsByClassName("ProductDetail__ingredients"),content;
        if(ing.length>0)
        {
            console.log("Found ing");
            content=ing[0].getElementsByClassName("ProductDetail__productContent");
            if(content.length>0)
            {
                resolve(content[0].innerText);
                return;
            }
        }
        reject("Failed ulta");
    }

    function parse_avon(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_avon\n"+response.finalUrl);
        var script=doc.getElementById("ScriptVariables");
        var regex=/\"Ingredients\":\"([^\"]+)\"/;
        var match=script.innerHTML.match(regex);
        if(match!==null)
        {
            resolve(match[1].trim());
        }
        reject("Failed parse_avon");
    }

    function parse_skinsafe(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_skinsafe\n"+response.finalUrl);
        var ing=doc.getElementById("ingredients"),clearfix,inner_a,i;
        var result="";
        if(ing)
        {
            clearfix=ing.getElementsByClassName("clearfix");
            if(clearfix.length>0)
            {
                inner_a=clearfix[0].getElementsByTagName("a");
                for(i=0; i < inner_a.length; i++)
                {
                    result=result+inner_a[i].innerText.trim()+",";
                }
                result=result.replace(/,$/,"");
                if(result.length>0)
                {
                    resolve(result.trim());
                    return;
                }
            }
        }

        reject("Failed parse_skinsafe");
    }

    function parse_drugs(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_drugs\n"+response.finalUrl);
        var tables=doc.getElementsByClassName("formTablePetite");
        var i,formHeadingTitle,j;
        var result="";
        for(i=0; i < tables.length; i++)
        {
            formHeadingTitle=tables[i].getElementsByClassName("formHeadingTitle");
           //console.log("i="+i+"\tformHeadingTitle="+formHeadingTitle[0]);
            if(formHeadingTitle[0]!==undefined)
            {
                            console.log("i="+i+"\tformHeadingTitle="+formHeadingTitle[0].innerText);
            }

            if(formHeadingTitle.length===0 || !/ingredient/i.test(formHeadingTitle[0].innerText))
                continue;
            //console.log("i="+i+"\tformHeadingTitle="+formHeadingTitle[0].innerText);

            for(j=2; j < tables[i].rows.length; j++)
            {
              //  console.log("tables["+i+"].rows["+j+"]="+tables[i].rows[j].innerText);
                result=result+tables[i].rows[j].cells[0].innerText.trim()+",";
            }
        }
        result=result.replace(/,$/,"");
        if(result.length>0)
        {
            resolve(result);
            return;
        }


        reject("Failed parse_drugs");
    }

     function parse_walgreens(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_walgreens\n"+response.finalUrl);
        var desc=doc.getElementById("Description-2");
       if(desc)
       {
           resolve(desc.innerText.trim());
       }
        reject("Failed parse_walgreens");
    }

    function parse_cosdna(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_cosdna\n"+response.finalUrl);
        var iStuffETitle=doc.getElementsByClassName("iStuffETitle"),iStuffNTitle=doc.getElementsByClassName("iStuffNTitle"),i;
        var result="";
        for(i=0; i < iStuffETitle.length; i++)
        {
            result=result+iStuffETitle[i].innerText+",";
        }
        for(i=0; i < iStuffNTitle.length; i++)
        {
            result=result+iStuffNTitle[i].innerText+",";
        }
        result=result.replace(/,$/,"");
        resolve(result);
        return;

    }

    function parse_skincarisma(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_skincarisma\n"+response.finalUrl);
        var table=doc.getElementsByClassName("ingredients-table");
        var curr_row,i,j,curr_val;
        var text="";
        if(table.length===0) { reject("Failed skincarisma"); return; }
        try
        {
            table=table[0];
        }
        catch(error) { reject("Failed skincarisma "+error); return; }
        console.log("table.innerHTML="+table.innerHTML);
        for(i=1; i < table.rows.length; i++)
        {
            curr_row=table.rows[i];

            curr_val=curr_row.cells[2].childNodes[0].nodeValue.trim();
            console.log("curr_val="+curr_val);
            text=text+curr_val+",";
        }

        resolve(text.replace(/,$/,""));
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    function parse_beautyhabit(response,resolve,reject)
    {
        var doc = new DOMParser(response)
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_beautyhabit\n"+response.finalUrl);
        var toggle=doc.getElementsByClassName("accordion-toggle"),content=doc.getElementsByClassName("accordion-content");
        var i,j,inner_text,contentkids;
        for(i=0; i < toggle.length; i++)
        {
            if(/Ingredients/i.test(toggle[i].innerText))
            {
                if(/reviveskincare\.com/.test(response.finalUrl))
                {
                    resolve(content[i].getElementsByTagName("p")[1].innerText);
                    return;
                }
                contentkids=content[i].childNodes;

                for(j=contentkids.length-1; j>=0 && contentkids[j].nodeType===Node.TEXT_NODE; j--) { }
                for(; j>=0 && contentkids[j].nodeType!==Node.TEXT_NODE; j--) { }
                console.log("j="+j+"\t"+contentkids[j].nodeValue);
                resolve(contentkids[j].nodeValue.trim());
                return;
                //inner_text=content[i].innerText.trim();
            }
        }

        reject("Failed beautyhabit");
    }


    


    function fix_name(name)
    {
         name=name.replace(/^SKII /,"SK-II ").replace(/ & /g," and ").replace(/&/g," and ");
        name=name.replace(/ EXFOL[A-Z]* /," EXFOLIATING ").replace( / CLEANS[A-Z]*(\s|$)/," CLEANSER$1")
        .replace(/A\/SHAVE\s/,"AFTERSHAVE ").replace(/DIFF /,"DIFFERENCE ").replace(/ GNTL[A-Z]* /," GENTLE ")
        .replace(/ MSSE /," MOUSSE ").replace(/ LTN(\s|$)/," LOTION$1").replace(/ EDTN(\s|$)/," EDITION$1")
        .replace(/ CTRATE(\s|$)/, " CONCENTRATE$1").replace(/ ESSNTL(\s|$)/, " ESSENTIAL$1").replace(/ TRTMNT(\s|$)/," TREATMENT$1")
        .replace(/ O\/C /," Oily To Combo ").replace(/ N\/C /," NORMAL TO COMBINATION ")
        .replace(/ CRM(\s|$)/," CREAM$1").replace(/\sREG[A-Z]*\sSTRNGTH(\s|$)/," REGULAR STRENGTH$1")
        .replace(/ HYDRAT(\s|$)/," HYDRATING$1").replace(/ SPR(\s|$)/," SPRAY$1").replace(/ WRN?KL(\s|$)/," WRINKLE$1")
        .replace(/ ILLUMIN[A-Z]*(\s|$)/," ILLUMINATING$1").replace(/ G\/LTN(\s|$)/," GEL-LOTION$1")
        .replace(/ RLF(\s|$)/," RELIEF$1").replace(/ EXTN(\s|$)/," EXTENDED$1").replace(/ MOIST(\s|$)/," MOISTURIZING$1")
        .replace(/ EMUL(\s|$)/, " EMULSION$1").replace(/ SHELD(\s|$)/," SHIELD$1").replace(/ CNTRL(\s|$)/," CONTROL$1")
        .replace(/ COMPLETE(\s|$)/," COMPLETE$1").replace(/ REVEAL\s/," REVEALING$1")
        .replace(/ W\/([A-Z]+)/, " WITH $1").replace(/ CPLX(\s|$)/," COMPLEX$1").replace(/ VIS(\s|$)/," VISIBLE$1")
        .replace(/ ENERY(\s|$)/," ENERGY$1").replace(/ TRNPRNC(\s|$)/," TRANSPARENCY$1")
        .replace(/ ANT([^A-Z]+)/," ANTI$1").replace(/ TRPL(\s|$)/," TRIPLE$1").replace(/ ACTN(\s|$)/," ACTION$1")
        .replace(/ PWDR(\s|$)/," POWDER$1").replace(/ SENS(\s|$)/," SENSITIVE$1").replace(/ ESS([^A-Z]+)/," ESSENTIAL$1")
        .replace(/ CLNS[A-Z]*(\s|$)/," CLEANSING$1").replace(/ VIT(\s|$)/," VITAMIN$1")
        .replace(/ NATRL(\s|$)/," NATURAL$1").replace(/ PROTCTN(\s|$)/, " PROTECTION$1").replace(/ BBY(\s|$)/," BABY$1")
        .replace(/ PROTECTI[A-Z]*(\s|$)/," PROTECTIVE$1").replace(/ SOLR(\s|$)/," SOLAR$1")
        .replace(/ HND(\s|$)/," HAND$1").replace(/ FX(\s|$)/," FIX").replace(/ SO?LU?TI?O?NS(\s|$)/," SOLUTIONS$1").replace( /SWSS(\s|$)/," SWISS$1")
        .replace(/ FO?RML(\s|$)/," FORMULA$1").replace(/ SPRT(\s|$)/," SPORT$1");

        name=name.replace(/ [A-Z]+\/[A-Z]+(\s|$)/,"$1");
        name=name.replace(/\s[\d\.]+\s/," ");

        name=name.replace(/X[\d]+$/,"")
        name=name.replace(/ FACIAL ANTI-AGING$/,"").replace(/ FACIAL CLEANSER$/,"").replace(/ HAND and BODY LOTION$/,"").replace(/ FACIAL MOISTURIZERS/,"");
        name=name.replace(/ SUNTAN LOTION and OIL$/,"").replace(/ ANTI-AGING$/,"");


        return name;
    }

    function paste_text(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        text=text.replace(/\n/g,",");
        e.target.value=text;
    }

    function init_Query()
    {
       // var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0],x;
        my_query={name:wT.rows[0].cells[1].innerText,try_count:0,site:"",url:"", company_name:"",doneCle:false};


        my_query.name=fix_name(my_query.name);

        document.getElementById("text").addEventListener("paste",paste_text);
        /* Set company_name */
        for(x in company_map)
        {
            if(company_map[x].reg.test(my_query.name))
            {
                my_query.company_name=x;
                if(company_map[x].dom!==undefined) my_query.url=company_map[x].dom;
            }
        }
        console.log("my_query.company_name="+my_query.company_name);
        if((my_query.company_name==="Clarisonic" && / (?:BRUSH|DEVICE)(\s|$)/.test(my_query.name)) || /(DEVICE|TOOL)$/.test(my_query.name)
          || / (DEVICE|TOOL) /.test(my_query.name) || my_query.company_name==="Dairyface" )
        {
            document.getElementById("text").value=my_query.name;
            check_and_submit(check_function,automate);
            return;
        }

      //  if(/^Bobbi Brown/i.test(my_query.name)) my_query.url="bobbibrowncosmetics.com";
   //      if(/^BURT'S BEES/i.test(my_query.name)) my_query.url="burtsbees.com";
        else if(/^CLARKS BOTANICALS/i.test(my_query.name)) my_query.url="clarksbotanicals.com";
        else if(/^CLE DE /i.test(my_query.name)) my_query.url="cledepeaubeaute.com";


        var search_str;
        if(my_query.url.length>0)
        {
            search_str=my_query.name +" site:"+my_query.url;


            const queryPromise2 = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response2);
            });
            queryPromise2.then(query_promise2_then
                             )
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        }
        else
        {
            search_str=my_query.name +" site:"+try_urls[my_query.try_count];

            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then
                             )
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        }





    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();
