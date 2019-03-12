// ==UserScript==
// @name         ParseSchoolDirectories
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include     *
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
// @connect http*tryshit.com*
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/Schools.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var my_query = {};
    var first_try=true;
    var MTP=MTurkScript.prototype;
   // let Schools=Schools||{};

    /**
     * School creates a new school query, type is a string either school or district
     * title_str is a string version of the title desired for use in internal site search queries (may need tuning
     * regarding lack of ability to get the right titles and inability to get all the results for a blank query at once)
     * title_regex is a list of RegExp for valid titles of contacts, name,street,city,state,zip are obvious
     * may add "short_name"}
     * query={type:"school|district",name:string,title_regex: [RegExp,...,],title_str:string,street:string,city:string,state:"ST",zip:str,url:url}
     *
     * if url is undefined it will do a Bing search for the url
     * Relies on MTP=MTurkScript.prototype and MTurkScript
     */
    function School(query,then_func,catch_func) {
        var x;
        this.contact_list=[];
        this.bad_urls=[".adventistdirectory.org","/alumnius.net",".areavibes.com",".biz/",".buzzfile.com",".chamberofcommerce.com",".city-data.com",".donorschoose.org",".dreambox.com",".edmodo.com",
                       ".educationbug.org",".elementaryschools.org",".estately.com",".facebook.com",".greatschools.org","//high-schools.com",
                       ".hometownlocator.com",".localschooldirectory.com",".maxpreps.com",".mapquest.com",".myatlantaareahome.com",".niche.com",
                       ".nonprofitfacts.com",".pinterest.com",".prekschools.org",
                       "/publicschoolsk12.com",".publicschoolreview.com",".ratemyteachers.com",".realtor.com",
                      ".schoolbug.org",".schoolfamily.com",".schooldigger.com","//twitter.com",".youtube.com",
                      ".teacherlists.com",".trueschools.com",".trulia.com",".usnews.com",
                      ".wagenersc.com",".wikipedia.org",".wikispaces.com",".wyzant.com",
                       ".yellowbook.com",".yellowpages.com",".yelp.com",".zillow.com"];
        this.query=query;
        this.name="";this.city="";this.state="";
        this.base="";
        this.resolve=then_func;
        this.reject=catch_func ? catch_func : MTP.my_catch_func;
        this.blackboard={parser:this.parse_blackboard,find_directory:this.find_dir_bb,href_rx:/.*/i,
                        text_rx:/(^Directory)|(Staff Directory(\s|$|,))|(^Faculty$)|(^Faculty\s*(&|and)\s*Staff$)|(^Staff$)/i,
                       find_base:this.find_base_blackboard};
        for(x in query) this[x]=query[x];
        this.name=this.name.replace(/\s*\(.*$/,"");
       // console.log("this.title_regex.length="+this.title_regex.length);
        var self={bad_urls:this.bad_urls};
        var promise=new Promise((resolve,reject) => {
            this.init();
        });
        promise.then(then_func).catch(catch_func);


    }
    /* toString redef */
    School.prototype.toString=function() {
        return JSON.stringify(this.query);
    };

    /* initialize the school */
    School.prototype.init=function() {
        var promise;
        this.try_count=0;
        if(this.url===undefined) promise=MTP.create_promise(this.get_bing_str(this.name+" "+this.city+" "+reverse_state_map[this.state]+" "),
                                                            this.parse_bing,this.parse_bing_then,MTP.my_catch_func,this);
        else promise=MTP.create_promise(this.url,this.init_SchoolSearch,this.resolve,this.reject,this);
    };
    /* TODO: tune */
    School.prototype.is_bad_name=function(b_name,p_caption) { if(/(^|[^A-Za-z]{1})(PTO|PTA)($|[^A-Za-z]{1})/.test(b_name)) return true;
                                                             return false; };
    School.prototype.get_bing_str=function(str) { return 'https://www.bing.com/search?q='+encodeURIComponent(str)+"&first=1&rdr=1"; };
    School.prototype.parse_bing_then=function(result) {
        var promise,self=result.self;
        result.self.url=result.url;
        promise=MTP.create_promise(self.url,self.init_SchoolSearch,self.resolve,self.reject,self);
    };
    School.prototype.parse_bing=function(doc,url,resolve,reject,self) {
        if(self.query.debug) console.log("in query_response\n"+url);

        var search, b_algo, i=0, inner_a;
        var bad_urls=self.bad_urls;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            /*console.log("b_algo.length="+b_algo.length);*/
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))&&parsed_context.url&&parsed_context.Title&&
              MTP.matches_names(self.query.name,parsed_context.Title)&&!MTP.is_bad_url(parsed_context.url,self.bad_urls,6,3)&&
                              (resolve({url:parsed_context.url,self:self})||true)) return;
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info)) && parsed_lgb.url&&parsed_lgb.url.length>0 &&
              MTP.get_domain_only(window.location.href,true)!==MTP.get_domain_only(parsed_lgb.url,true)&&!MTP.is_bad_url(parsed_lgb.url,self.bad_urls,6,3)) {
                if(self.query.debug) console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                resolve({url:parsed_lgb.url,self:self});
                return;
            
            }
            for(i=0; i < b_algo.length&&i<10; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0)?b_caption[0].getElementsByTagName("p")[0].innerText:"";
                if(self.query.debug) console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if((!MTP.is_bad_url(b_url,self.bad_urls,6,4)||/\/vnews\/display\.v\/SEC\//.test(b_url)) && !self.is_bad_name(b_name,p_caption) && (b1_success=true)) break;
            }
            if(b1_success && (resolve({url:b_url,self:self})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(parsed_lgb&&parsed_lgb.url&&parsed_lgb.url.length>0) resolve({url:parsed_lgb.url,self:self});
        else if(self.try_count++===0) {
            let promise=MTP.create_promise(self.get_bing_str(self.name+" "+self.city+" "+reverse_state_map[self.state]+" website"),
                                                            self.parse_bing,resolve,reject,self);
        }
        else reject("No school website found for "+self.query.name+" in "+self.query.city+", "+self.query.state);
        //        GM_setValue("returnHit",true);
        return;

    };
    School.prototype.matches_title_regex=function(title) {
        for(var i=0; i < this.title_regex.length; i++) {
            console.log("this.title_regex["+i+"]="+this.title_regex[i]);

            if(title.match(this.title_regex[i])) return true; }
        return false;
    };
    School.prototype.matches_name=function(name) {
        //console.log("this.name="+this.name);
        var the_regex=/[\.\']+/g,dash_regex=/-/g,the_regex2=/ School$/;
        var short_school=this.name.replace(the_regex,"").replace(dash_regex," ").replace(the_regex2,"").toLowerCase().trim();
        var short_name=name.replace(the_regex,"").replace(dash_regex," ").replace(the_regex2,"").toLowerCase().trim();
        if(short_name.length===0) return false;
        if(short_name.indexOf(short_school)!==-1 || short_school.indexOf(short_name)!==-1) return true;
        return false;
    };
    /* Schools.call_parser is a helper function to create a promise for the school parser */
    School.prototype.call_parser=function(result) {
        var self=result.self,url=result.url;
        //console.log("self="+JSON.stringify(self));
        var promise=MTP.create_promise(url,self[self.page_type].parser,self.resolve,self.reject,self);
    };
    School.prototype.init_SchoolSearch=function(doc,url,resolve,reject,self) {
        var curr_school,promise,parse_url;
        self.base=url.replace(/\/$/,"")
        self.url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1");
        
        self.resolve=resolve;self.reject=reject;
        self.page_type=self.id_page_type(doc,url,resolve,reject,self);
        if(Schools.page_map[self.page_type]!==undefined) self.page_type=Schools.page_map[self.page_type];
       // Schools.curr_school=Schools[Schools.page_type];

        /*console.log("School.prototype.init_SchoolSearch, url="+url+", query="+JSON.stringify(self.query));
        console.log("page_type="+self.page_type);*/
        console.log("|"+self.query.name+"|"+url+"|"+self.query.street+"|"+self.query.city+"|"+self.query.state+"|"+self.page_type);
        return;
        /* Base is the base page for a school if we're in a district/system page */
        if((curr_school=self[self.page_type])&&curr_school.find_base&&self.type==="school") {
            console.log("searching for base "+JSON.stringify(Schools[self.page_type]));
            self.base=curr_school.find_base(doc,url+(curr_school.base_suffix?curr_school.base_suffix:""),resolve,reject,self).replace(/\/$/,""); }
        console.log("self.base="+self.base);
      
        /* if suffix we can immediately head to the directory parser */
        if(curr_school && curr_school.suffix) {
            console.log("# heading immediately to directory");
            self.call_parser(self.base+curr_school.suffix); }
        else if(curr_school && curr_school.find_directory) {
            console.log(self.name+": Finding directory");
            promise=MTP.create_promise(self.base,curr_school.find_directory,self.call_parser,MTP.my_catch_func,self);
        }
        else if(!curr_school) { console.log("School page_type not defined parsing yet, trying parse_none");



                              }
        else { console.log("Weird shouldn't be here"); }
    };

        /**Schools.id_page_type identifies the CMS/etc for the school website */
    School.prototype.id_page_type=function(doc,url,resolve,reject,self) {
        var page_type="none",i,j,match,copyright,sites_google_found=false,generator="",gen_content,gen_list=doc.querySelectorAll("meta[name='generator' i]");
        var page_type_regex2=/Apptegy/,copyright_regex=/Blackboard, Inc/,page_type_regex=new RegExp(Schools.page_regex_str,"i");
        for(i=0; i < gen_list.length; i++) {
            if(gen_list[i].content) { generator+=(generator.length>0?";":"")+gen_list[i].content.replace(/ - [^;]*/g,""); }
        }
            //console.log("generator="+(generator[i].content));
        var lst=[doc.links,doc.querySelectorAll("link")];
        for(j=0;j<lst.length;j++) {
            for(i=0; i < lst[j].length; i++) {
                lst[j][i].href=MTP.fix_remote_url(lst[j][i].href,url);

                if((match=lst[j][i].href.match(page_type_regex)) || (match=lst[j][i].innerText.match(page_type_regex2))) {
                    page_type=match[0].replace(/\.[^\.]*$/,"").toLowerCase().replace(/www\./,"").replace(/\./g,"_").replace(/^\/\//,"");
                    break; }
                else if(/sites\.google\.com/.test(lst[j][i].href) && /Google Sites/i.test(lst[j][i].innerText)) sites_google_found=true;
                else if(generator.length===0 && MTP.get_domain_only(url,true)===MTP.get_domain_only(lst[j][i].href,true) &&
                        /\/wp-content|wp\//.test(lst[j][i].href)) generator="WordPress";
                else if(/\/CMSScripts\//.test(lst[j][i].href)) generator="Kentico";
            }
        }
        doc.querySelectorAll("footer").forEach(function(footer) {
            if(footer.dataset.createSiteUrl&&/sites\.google\.com/.test(footer.dataset.createSiteUrl)) sites_google_found=true; });
        if(page_type==="none" && doc.getElementById("sw-footer-copyright")) page_type="blackboard";
        else if(page_type==="none"&& sites_google_found) page_type="sites_google";
        if(page_type==="none") {
            doc.querySelectorAll("script").forEach(function(curr_script) {
                for(i=0; i < Schools.script_regex_lst.length;i++) {
                    if(curr_script.src&&Schools.script_regex_lst[i].regex.test(curr_script.src)) page_type=Schools.script_regex_lst[i].name;
                    //  else if(curr_script.innerHTML.indexOf("_W.configDomain = \"www.weebly.com\"")!==-1) console.log("generator=weebly.com");
                }
            });
        }
        if(page_type==="none" && generator.length>0) return Schools.fix_generator(generator);
        return page_type;
    };
    /* Fix if page is id'd via generator */
    Schools.fix_generator=function(generator_str) {
        var match,gen_regex=/(?:^|[^A-Za-z]{1})(Joomla|Drupal|Starfield Technologies|One\.com|Wix\.com)(?:$|[^A-Za-z]{1})/;
        if(match=generator_str.match(gen_regex)) return match[1].replace(/\.com/g,"");
        generator_str=generator_str.replace(/(^|;)Powered By /ig,"$1");
        generator_str=generator_str.replace(/\s(v\.)?[\d]+\.[\d]+[\.\d]*\s*/g,"");
        if(/^WordPress/i.test(generator_str)) generator_str=generator_str.replace(/;WordPress/ig,"");
        return generator_str;
    };


    /* TODO: Schools.matches_name checks if a given name matches the desired school's name, needs lots of work I assume */
    Schools.matches_name=function(name) {
        console.log("this.name="+this.name);
        var the_regex=/[\.\']+/g,dash_regex=/-/g;
        var short_school=this.name.replace(the_regex,"").replace(dash_regex," ").toLowerCase().trim();
        var short_name=name.replace(the_regex,"").replace(dash_regex," ").toLowerCase().trim();
        if(short_name.length===0) return false;
        if(short_name.indexOf(short_school)!==-1 || short_school.indexOf(short_name)!==-1) return true;
        return false;
    };
    /* Note: Matches undefined cities too
    TODO: Deal with Mount/Mt. Saint/St. etc shit
    */
    Schools.matches_city=function(city) {
        if(Schools.city===undefined || Schools.city===null) return true;
        var short_mycity=Schools.city.toLowerCase().trim(),short_city=city.toLowerCase().trim();
        //console.log("short_mycity="+short_mycity+", short_city="+short_city);
        return short_mycity===short_city;
    };
    /* Schools.matches_title_regex is a function to check if a title matches something in
    * the query in Schools.title_regex */
    Schools.matches_title_regex=function(title) {
        for(var i=0; i < Schools.title_regex.length; i++) if(title.match(Schools.title_regex[i])) return true;
        return false;
    };
    /* Find the staff directory in a systematic way, curr_type is the type of page being done */
    Schools.find_dir=function(doc,url,resolve,reject,curr_type) {
        var links=doc.links,i;
        var domain=MTP.get_domain_only(url);

        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(MTP.get_domain_only(links[i].href)!==domain) continue;
            if(curr_type.href_rx.test(links[i].href) &&
               curr_type.text_rx.test(links[i].innerText.trim())) {
                console.log(domain+": resolving on "+links[i].innerText+",url="+links[i].href);
                resolve(links[i].href); return; }
        }
        console.log(domain+": could not find, resolving on base "+url);
        resolve(url);
    };
    /* TODO: needs work other possible locations of staff directory exist */
    Schools.find_dir_eschoolview=function(doc,url,resolve,reject,count) {
        if(count===undefined || typeof(count)==="object") count=0;
        console.log("in find_dir_eschoolview, url="+url+" ,count="+count);
        var links=doc.links,i,promise;

        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);

            if(/Staff Directory/i.test(links[i].innerText)) {
                console.log("Resolving on "+links[i].href); resolve(links[i].href); return; }
        }
        console.log("Done for");
        if(count++===0 && (promise=MTP.create_promise(Schools.base+"/ContactUs.aspx",Schools.find_dir_eschoolview,resolve,reject,count))) return;
        else { console.log("Resolving on StaffDirectory.aspx"); resolve(Schools.base+"/StaffDirectory.aspx"); }

    };
    /* TODO: Have it choose the school to select */
    Schools.parse_eschoolview=function(doc,url,resolve,reject) {
        var form=doc.querySelector("form"),query_url,scripts=doc.scripts,i,footer=doc.querySelector("footer");
        var inp=form.getElementsByTagName("input"),sel=form.getElementsByTagName("select"),match;
        var script_rx=/PageRequestManager\._initialize\('([^\']+)\'[^\[]*\[\'([^\']*)/,name_sel=form.querySelector("select");
        var data={},ops,data_str,promise,scriptm;
        var headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8","Host": Schools.base.replace(/^https?:\/\//,"").replace(/\/$/,""),
                     "Origin": Schools.base,"Referer": "http://www.gmsdk12.org/StaffDirectory.aspx","X-Requested-With": "XMLHttpRequest"};
        //console.log("headers="+JSON.stringify(headers));
        if(/GeneralError/.test(url) && Schools.try_count++===0) {
            promise=MTP.create_promise(Schools.base,Schools.parse_none,resolve,reject);
            return; }
        query_url=MTP.fix_remote_url(form.action,url);
        if(!footer) footer=doc.querySelector("#footerDiv");
        if(footer && (match=footer.innerText.match(/Phone:\s*([\(\)-\s\d\/]+)/i))) Schools.phone=match[1].trim();
        else Schools.phone="";
        ops=name_sel.options;
        for(i=0;i<scripts.length;i++) if((match=scripts[i].innerHTML.match(script_rx)) && (scriptm=match[1]) && (data[scriptm]=match[2].replace(/^t/,""))) break;
        for(i=0;i<inp.length;i++) {
            if(inp[i].type==="text" || inp[i].type==="hidden") data[inp[i].name]=inp[i].value;
            else if(inp[i].type==="submit" && /search/i.test(inp[i].value) &&
                    (data[inp[i].name]=inp[i].value)) data[scriptm]=data[scriptm]+"|"+inp[i].name;
        }
        for(i=0;i<ops.length;i++) if(Schools.matches_name(ops[i].innerText)) data[name_sel.name]=ops[i].value;
        data.__ASYNCPOST=true;
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
       // console.log("data="+JSON.stringify(data));
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                       onload: function(response) {
                           console.log("response="+JSON.stringify(response));
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.parse_eschoolview_response(doc,response.finalUrl, resolve, reject); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
    };

    Schools.parse_eschoolview_response=function(doc,url,resolve, reject) {
        var results=doc.querySelector(".results"),curr_contact;
        var main_div=results.parentNode.nextElementSibling;
       // console.log("main_div.innerHTML="+main_div.innerHTML);
        var spans=main_div.children,i;
        for(i=0;i<spans.length;i++) {
            //console.log("spans["+i+"].innerHTML="+spans[i].innerHTML);
            curr_contact={name:spans[i].querySelector(".scName")?Schools.parse_name_func(spans[i].querySelector(".scName").innerText.trim()):"",
                          title:spans[i].querySelector(".scTitle")?spans[i].querySelector(".scTitle").innerText.trim():"",
                          phone:spans[i].querySelector(".scPhone")&&spans[i].querySelector(".scPhone").innerText.length>0
                          ?spans[i].querySelector(".scPhone").innerText.trim():Schools.phone,
                          email:spans[i].querySelector(".scEmail")?spans[i].querySelector(".scEmail").innerText.trim():""};
            if(curr_contact.title && Schools.matches_title_regex(curr_contact.title)) Schools.contact_list.push(curr_contact);
        }
        if(spans.length===0) { console.log("doc.body.innerHTML="+doc.body.innerHTML); }
        resolve("");
    };
    Schools.find_base_schoolblocks=function(doc,url,resolve,reject) {
        var primary=doc.querySelector(".cd-primary-nav"),i;
        var n_link=doc.querySelectorAll(".sb-navbar-link-text"),school_list,school_nav;
        for(i=0;i<n_link.length;i++) {
            if(/Schools/.test(n_link[i].innerText) && (school_list=n_link[i].nextElementSibling)) break;
        }
        if(school_list) school_nav=school_list.querySelectorAll("sb-organizations-navbar-text-color");
        else return url;
        for(i=0;i<school_nav.length;i++) {
            if(Schools.matches_name(school_nav[i].innerText)) return school_nav[i].href;
        }
        return url;

    };

    School.prototype.find_base_blackboard=function(doc,url,resolve,reject,self) {
        var lst=doc.querySelectorAll(".schoollist a"),inner_a,i;
        var bad_regex=/(^\s*javascript|mailto)|((\.|\/)(facebook|youtube|twitter)\.com)/i;

        if(lst.length===0 && (lst=doc.querySelectorAll(".schools a")).length===0) lst=doc.querySelectorAll("a");
        var domain=MTP.get_domain_only(url,false);
       // console.log(domain+": in find_base_blackboard, lst.length="+lst.length);
        for(i=0;i<lst.length;i++) {
            lst[i].href=MTP.fix_remote_url(lst[i].href,url).replace(/\/$/,"");
           // console.log(domain+": lst["+i+"].innerText="+lst[i].innerText);
            if(self.matches_name(lst[i].innerText.trim()) && !bad_regex.test(lst[i].href)

              ) return MTP.fix_remote_url(lst[i].href,url);
        }
        return url;
    };
    School.prototype.find_dir_bb=function(doc,url,resolve,reject,self) {

        var links=doc.links,i,scripts=doc.getElementsByTagName("script");
        var domain=MTP.get_domain_only(url);
        var contact,new_url;
        var curr_type=self[self.page_type];
        console.log(domain+":curr_type="+JSON.stringify(curr_type)+", "+curr_type.text_rx);
      //  console.log(domain+"self="+JSON.stringify(self));
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
          //  console.log(domain+": links["+i+"].innerText="+links[i].innerText.trim());
            if(MTP.get_domain_only(links[i].href)!==domain) continue;
            if(/Contact Us/.test(links[i].innerText)) contact=links[i].href;
            if(
               curr_type.text_rx.test(links[i].innerText.trim()) && !/\.pdf$/.test(links[i].href)) {
                console.log(domain+": resolving on "+links[i].innerText+",url="+links[i].href);
                resolve({url:links[i].href,self:self}); return; }
        }
        if(contact) console.log(domain+": resolving on contact "+contact);
        else if((new_url=self.find_dir_bb_scripts(scripts,url))) {
            console.log(domain+": resolving from scripts "+new_url);
            resolve({url:new_url,self:self}); }
        else {

            console.log(domain+": could not find, resolving on base "+url);
            resolve({url:url,self:self}); }
    };
    /* Returns url if found in scripts, null otherwise */
    School.prototype.find_dir_bb_scripts=function(scripts) {
        var i,j,match,icons_regex=/menuGlobalIcons\s*\=\s*([^;]+)/,parsed;
        var staff_regex2=/\"(?:Staff )?Directory\",\s*\"(\/[^\"]*)\"/;
        for(i=0;i<scripts.length;i++) {
            if(match=scripts[i].innerHTML.match(icons_regex)) {
                parsed=JSON.parse(match[1]);
                for(j=0;j<parsed.length;j++) {
                    if(parsed[j].length>=2 && /Directory/.test(parsed[j][0])) return Schools.url+parsed[j][1];
                }
            }
            else if(match=scripts[i].innerHTML.match(staff_regex2)) return Schools.url+match[1];
        }
        return null;

    };
    School.prototype.parse_blackboard=function(doc,url,resolve,reject,self) {
        if(self.count===undefined) self.count=0;
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var staffdirectory=doc.querySelector(".staffdirectorydiv"),minibase=doc.querySelector(".minibase")
        var swdirectory=doc.querySelector(".sw-directory-item"),promise,footer=doc.querySelector(".gb-footer");
        var domain=MTP.get_domain_only(url),match;
        if(!footer && !(footer=doc.querySelector("#gb-footer"))) footer=doc.querySelector("footer");
        //console.log("footer.innerHTML="+footer.innerHTML);

        if(footer && (match=footer.innerText.match(/(\d{3}-\d{3}-\d{4})|(\(\d{3}\)\s*\d{3}-\d{4})/i))) self.phone=match[0].trim();
        else self.phone="";
        if(match=self.phone.match(/^(?:\()?([\d]{3})/)) self.area_code=match[1];
        else self.area_code="";
        console.log("self.phone="+self.phone+", self.area_code="+self.area_code);
        if((staffdirectory||(staffdirectory=doc.querySelector(".cs-staffdirectorydiv"))) &&
          (self.staffdirectory=staffdirectory)) self.parse_bb_staffdirectory(doc,url,resolve,reject,self);
        else if(minibase && (self.minibase=minibase)) self.parse_bb_minibase(doc,url,resolve,reject,self);
        else if(swdirectory) self.parse_bb_swdirectory(doc,url,resolve,reject,self);
        else {
            console.log(domain+":Could not identify blackboard directory type "+url);

        }
       // console.log("parse_blackboard, url="+url);
    };
    /* staffdirectoryresponsivediv (type1) */
    School.prototype.parse_bb_staffdirectory=function(doc,url,resolve,reject,self) {
        var dir=self.staffdirectory;
        var inner_a=dir.querySelectorAll("a"),i;
        var domain=MTP.get_domain_only(url);
        var click_regex=/SearchButtonClick\(\'([^\']*)\',\s*([\d]*),\s*([\d]*),\s*([\d]*),\s*([\d]*)/,match;
        console.log("parse_bb_staffdirectory,url="+url);
        var url_begin=self.url+"/site/default.aspx?PageType=2&PageModuleInstanceID="; //&ViewID=
        var url_end="&RenderLoc=0&FlexDataID=0&Filter=JobTitle%3A"+encodeURIComponent(self.title_str);
        var new_url,promise;
        for(i=0;i<inner_a.length;i++) {
          
            if((match=inner_a[i].outerHTML.match(click_regex))) {
                new_url=url_begin+match[5]+"&ViewID="+match[1]+url_end;
                promise=MTP.create_promise(new_url,self.parse_bb_staffdirectory_results,resolve,reject,self);
                break;
            }
        }
        if(promise===undefined) { console.log(domain+": Could not find SearchButtonClick and create promise"); }

    };
    /* TODO: deal with area codes, otherwise done */
    School.prototype.parse_bb_staffdirectory_results=function(doc,url,resolve,reject,self) {
        console.log("parse_bb_staffdirectory_result,url="+url);
        var cs="",staff,i,curr_contact,footer=doc.querySelector(".gb-footer"),staffemail,match;
        if(doc.querySelector(".cs-staffdirectorydiv")) cs="cs-";
        staff=doc.querySelectorAll("."+cs+"staff");
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        for(i=0;i<staff.length;i++) {
            curr_contact={name:staff[i].querySelector("."+cs+"staffname").innerText.trim(),
                         title:staff[i].querySelector("."+cs+"staffjob").dataset.value.trim(),
                          phone:staff[i].querySelector("."+cs+"staffphone").innerText.trim().replace(/\n/g,"").replace(/\s{2,}/g," ")
                         };
            if(curr_contact.phone.length>0 &&
               !phone_re.test(curr_contact.phone) && self.area_code.length>0) curr_contact.phone="("+self.area_code+") "+curr_contact.phone;
            else if(curr_contact.phone.length===0) curr_contact.phone=self.phone;
            staffemail=staff[i].querySelector(".staffemail script");
            if(staffemail&&(match=staffemail.innerHTML.match(/swrot13\(\'([^\']+)\'/))) {
                curr_contact.email=MTP.swrot13(match[1]);
            }
            //console.log("curr_contact="+JSON.stringify(curr_contact))
            if(self.matches_title_regex(curr_contact.title)) self.contact_list.push(curr_contact);
        }
        resolve(self);
    };
    /* Probably best to just grab all the pages for a school since we don't know what we want */
    School.prototype.parse_bb_minibase=function(doc,url,resolve,reject,self) {
        console.log("parse_bb_minibase,url="+url);
        var minibase=self.minibase;
        var mod=minibase.parentNode,match,i,j,ModuleInstanceID=0,PageModuleInstanceID=0,ui_lbl,ui_dropdown;
        var detail=minibase.querySelector(".ui-widget-detail"),url_begin,url_end,new_url,field_num,ui_li;
        var filter="&FilterFields="+encodeURIComponent("comparetype:E:S;comparetype:E:S;"),promise;
        var flexitem=minibase.querySelectorAll(".sw-flex-item"),matched_school=false,matched_title=false;
        var fields=doc.querySelectorAll("[name^='Field']");
        var missing_field=-1;
        for(i=0;i<fields.length;i++) if((match=fields[i].id.match(/[\d]+$/)) && parseInt(match[0])>i && (missing_field=i)) break;
        if(match=mod.id.match(/[\d]+$/)) ModuleInstanceID=match[0];
        if(detail && (match=detail.id.match(/[\d]+$/))) PageModuleInstanceID=match[0];
        url_end="&DirectoryType=L&PageIndex=1";
        new_url=self.url+"/site/UserControls/Minibase/MinibaseListWrapper.aspx?ModuleInstanceID="+ModuleInstanceID;
        new_url=new_url+"&PageModuleInstanceID="+PageModuleInstanceID;
        for(i=0;i<flexitem.length;i++) {
            ui_lbl=flexitem[i].querySelector(".ui-lbl-inline");
            ui_dropdown=flexitem[i].querySelector("ul");
            if(!matched_school && /School|Location/i.test(ui_lbl.innerText) && ui_dropdown && (ui_li=ui_dropdown.querySelectorAll("li"))) {

                field_num=ui_dropdown.id && ui_dropdown.id.match(/[\d]+$/) ? ui_dropdown.id.match(/[\d]+$/)[0] : i.toString();
                for(j=0;j<ui_li.length;j++) {
                    if(self.matches_name(ui_li[j].innerText) && (matched_school=true) &&
                       (filter=filter+encodeURIComponent(field_num+":C:"+ui_li[j].innerText.trim()+";"))) break;
                }
            }
            if(/Title|Position/i.test(ui_lbl.innerText) &&(matched_title=true)) filter=filter+encodeURIComponent((i).toString()+":C:"+self.title_str+";");
        }
        /* If a field was missing and there was no title field, hopefully that was the title field */
        if(!matched_title && missing_field>=0) filter=filter+encodeURIComponent((missing_field).toString()+":C:"+self.title_str+";");
        new_url=new_url+filter+url_end;
        console.log("new_url="+decodeURIComponent(new_url));
        self.page=1;
        promise=MTP.create_promise(new_url,self.parse_bb_minibase_results,resolve,reject,self);

    };
    School.prototype.parse_bb_minibase_results=function(doc,url,resolve,reject,self) {
        var page=self.page;
        var curr_contact,lst=doc.querySelectorAll(".sw-flex-item-list"),i,j,label,items,x;
        var term_map={"first":/First/i,"last":/Last/i,"title":/^(Position|Title)/i,"email":/^E(-)?mail/i,
                      "phone":/^(Phone|Tel)/i,"ext":/^(Ext)/i,"school":/School/i};
        console.log("parse_bb_minibase_results,url="+url);
        for(i=0;i<lst.length;i++) {
            curr_contact={};
            items=lst[i].querySelectorAll(".sw-flex-item");
            for(j=0;j<items.length;j++) {
                label=items[j].querySelector(".sw-flex-item-label").innerText;
                for(x in term_map) if(term_map[x].test(label.trim())) curr_contact[x]=items[j].innerText.replace(label,"").trim();
            }
            if(curr_contact.first && curr_contact.last) curr_contact.name=curr_contact.first+" "+curr_contact.last;
            if(!curr_contact.phone || curr_contact.phone.length===0) curr_contact.phone=self.phone;
            if(curr_contact.phone && curr_contact.phone.length>0 &&
               curr_contact.ext && curr_contact.ext.length>0) curr_contact.phone=curr_contact.phone+" x"+curr_contact.ext;
            console.log("curr_contact="+JSON.stringify(curr_contact));
            if(curr_contact.title && self.matches_title_regex(curr_contact.title)) self.contact_list.push(curr_contact);
        }
        resolve(self);
       // console.log("flexlist="+flexlist.innerHTML);
    };

    School.prototype.parse_bb_swdirectory=function(doc,url,resolve,reject,self) {
        console.log("parse_bb_swdirectory,url="+url);
    };




    Schools.parse_none=function(doc,url,resolve,reject) {
        console.log("In Schools.parse_none, url="+url); }
    /* Find the base url for the desired school for blackboard */
    
   
    Schools.apptegy={parser:Schools.parse_apptegy,suffix:"/staff",then:Schools.parse_apptegy_then,find_base:Schools.find_base_apptegy};
    Schools.blackboard={parser:Schools.parse_blackboard,find_directory:Schools.find_dir_bb,href_rx:/.*/i,
                        text_rx:/(^Directory)|(Staff Directory(\s|$|,))|(^Faculty$)|(^Faculty\s*(&|and)\s*Staff$)|(^\s*Staff\s*$)/i,
                       find_base:Schools.find_base_blackboard};
    Schools.catapultk12={parser:Schools.parse_catapultk12,find_directory:Schools.find_dir,href_rx:/\/Staff-Directory/,text_rx:/Directory/i};
    Schools.eschoolview={parser:Schools.parse_eschoolview,find_directory:Schools.find_dir_eschoolview};
    Schools.schoolblocks={find_base:Schools.find_base_schoolblocks,base_suffix:"/schools"};
    Schools.none={parser:Schools.parse_none,suffix:"/"};
    // Often suffix:"/StaffDirectory.aspx" not always tho sometimes /FacultyStaffDirectory.aspx /staffdirectory9479.aspx

    function find_emails(response,appendElement) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j,email_val,my_match,email_list=[],principal_url="",contact_url="",directory_url="";
        if(try_specific(doc,response.finalUrl,appendElement)) return;
        console.log("in contact response "+response.finalUrl);
        for(i=0; i < email_list.length; i++) console.log("email_list["+i+"]="+email_list[i]);
        if(++my_query.try_count>4) return;
        var begin_url=response.finalUrl.replace(/(https:\/\/[^\/]+)\/.*$/,"$1");
    }
       /* Schools.parse_name_func is a helper function for parse_data_func */
    Schools.parse_name_func=function(text) {
        var split_str,fname,lname,i;
        var appell=[/^Mr\.?\s*/,/^Mrs\.?\s*/,/^Ms\.?\s*/,/^Miss\s*/,/^Dr\.?\s*/],suffix=[/,?\s*Jr\.?/];
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        if(text!==undefined && /[a-z]{2,}/.test(text)) {
            while(text!==undefined && /(,?\s*[A-Z]+)$/.test(text)) {
                text=text.replace(/(,?\s*[A-Z]+)$/,""); }
        }
        for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    };
        /**
     * Schools.parse_data_func parses text
     */
    Schools.parse_data_func=function(text) {
        var ret={};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, s_part="", second_arr,begin_name="";

        var has_pasted_title=false,title_prefix,dept_name;
        if(!/@/.test(text)) return;
        //console.log("text="+text);
        text=text.replace(/([a-z]{1})([A-Z][a-z]+:)/g,"$1\t$2").replace(/([a-z]{1})\s{1,}([\d]{1})/g,"$1\t$2")
           .replace(/([\d]{1})\s{1,}([A-Za-df-wy-z]{1})/g,"$1\t$2").replace(/([A-Za-z]{1})\s([A-Za-z0-9\._]+@)/,"$1\t$2")
        .replace(/([^\s]+)\s+([^\s@]+@[^\s@]+)/g,"$1\t$2")
        .replace(/(-[\d]+)([a-zA-Z]+)/g,"$1\t$2").replace(/([a-zA-Z]+)([\d]+-)/g,"$1\t$2");;
        if((text=text.trim()).length===0) return ret;
        var split_lines_1=(text=text.trim()).split(Schools.split_lines_regex),split_lines=[],temp_split_lines,new_split;
        var found_email=false,split_comma,found_phone=false;
        if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
            split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1)); }
        else split_lines=split_lines_1;
        if((split_comma=split_lines[0].split(","))&&split_comma.length>1&&Schools.title_regex.test(split_comma[0])) {
            split_lines=split_comma.concat(split_lines.slice(1)); }
        console.log("split_lines="+JSON.stringify(split_lines));
        split_lines=split_lines.filter(line => line && line.replace(/[\-\s]+/g,"").trim().length>0);
        split_lines=split_lines.map(line => line.replace(/^\s*[\(]*/,"").replace(/[\)]*\s*$/,"").trim());


        if(split_lines.length>0&&(split_comma=split_lines[0].split(","))&&split_comma.length>1&&Schools.title_regex.test(split_lines[0])) {
            split_lines=split_comma.concat(split_lines.slice(1)); }
        console.log("split_lines="+JSON.stringify(split_lines));
        while(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").filter(line=>line && line.trim().length>0).concat(split_lines.slice(1));

        /** Additional code **/
        if(Schools.title_regex.test(split_lines[0]) &&
           (temp_split_lines=split_lines.splice(0,1))) {
            split_lines.splice(1,0,temp_split_lines[0]); }

        if(split_lines.length>0&&(title_prefix=split_lines[0].match(Schools.title_prefix_regex))) {
            split_lines=[split_lines[0].replace(Schools.title_prefix_regex,"")].concat([title_prefix[0]].concat(split_lines.slice(1))); }
        while(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").filter(line=>line && line.trim().length>0).concat(split_lines.slice(1));
        /** End additional code **/

        var good_stuff_re=/[A-Za-z0-9]/;
        if(split_lines===null) return;
        console.log("parse_data_func: "+JSON.stringify(split_lines));
        for(j=0; j < split_lines.length; j++) {
            if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j]) && !Schools.bad_stuff_re.test(split_lines[j])&& !(split_lines[j].match(email_re))) break;
        }
        if(j>=split_lines.length) return ret;
        split_comma=split_lines[j].split(/,/);
        if(split_comma.length===2 && /[^\s]\s/.test(split_comma[0])) {
           // console.log("Doing split_comma");
            var curr_last=split_lines.length-1;
            split_lines.push(split_lines[curr_last]);
            for(k=curr_last; k>=j+2; k--) split_lines[k]=split_lines[k-1];
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }
        if(split_lines.length>0 && j<split_lines.length &&
           split_lines[j] && split_lines[j].trim().length > 0) {
            if(!/\s/.test((begin_name=split_lines[j].trim()))
               && j+1 < split_lines.length) begin_name=begin_name+" "+split_lines[(j++)+1];
            ret.name=Schools.parse_name_func(begin_name?begin_name:"");
        }

        for(i=j+1; i < split_lines.length; i++)
        {
         //   found_email=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
          //  console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
            if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim())) continue;
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            s_part=second_arr[second_arr.length-1].trim();
            //console.log("s_part="+s_part);
            if(email_re.test(s_part) && !found_email &&(found_email=true)) ret.email=s_part.match(email_re)[0];
            else if(phone_re.test(s_part)&& !found_phone && (found_phone=true)) ret.phone=s_part.match(phone_re)[0];
            else if(s_part.length>10 && !found_phone && s_part.substr(0,10)==="Phone Icon" &&
                    phone_re.test(s_part.substr(11)) && (found_phone=true)) ret.phone=s_part.substr(11).match(phone_re)[0];
            else if((s_part.trim().length>0  && !has_pasted_title) || s_part.indexOf("Title:")!==-1)
            {
                if(/^ext/.test(s_part)) ret.phone=(ret.phone+" "+s_part.trim()).trim();
                else if(has_pasted_title=true) ret.title=s_part.replace(/^Title:/,"").trim();
            }
        }
        console.log("ret="+JSON.stringify(ret));
        return ret;
    };

    /* Converts cyberschools and IES email from encoded form */
    Schools.convert_cyberschools_email=function(text) {
        var split_text=[],i,ret="";
        /* map to correct character */
        function get_value(char) {
            if(/^[A-Z]+/.test(char)) return (char.charCodeAt(0)-65);
            else if(/^[a-z]+/.test(char)) return (26+char.charCodeAt(0)-97);
            else if(/^[0-9]+/.test(char)) return (52+char.charCodeAt(0)-48);
            else {
                console.log("Got a non-alphanumeric character"); return -1; }
        }

        /* get the first character */
        function get_first(text) { return text.length>=2 ? String.fromCharCode(get_value(text.charAt(0))*4+get_value(text.charAt(1))/16) : ""; }
        function get_second(text) { return text.length>=3 ? String.fromCharCode((get_value(text.charAt(1))%16)*16+get_value(text.charAt(2))/4) : ""; }
        function get_third(text) { return text.length>=4 ? String.fromCharCode((get_value(text.charAt(2))%4)*64+get_value(text.charAt(3))): ""; }
        for(i=0;i<text.length;i+=4) split_text.push(text.substr(i,4));
        for(i=0;i<split_text.length; i++) {
            split_text[i]=split_text[i].replace(/\=/g,"");
            ret=ret+get_first(split_text[i])+get_second(split_text[i])+get_third(split_text[i]);
        }
        return ret;

    };

    /**
     * convert_ednetworks_email converts
     * emails for the educational networks websites (edlio some places?)
     * input value text comes from either <input type="hidden" name="e" value="([\d]+),?"> or
     * from urls with e=([\d]+)
     */
    Schools.convert_ednetworks_email=function(text) {
        var i, split_text=[],ret_text="",dot_char=9999;
        /* Split into 4 character chunks */
        for(i=0; i < text.length; i+=4) split_text.push(text.substr(i,4));
        /** Take the 3rd chunk from right if smaller than 4th (i.e.in case it's .k12.XX.us) **/
        for(i=0; i < split_text.length; i++) dot_char=parseInt(split_text[i])<dot_char ? parseInt(split_text[i]) : dot_char;
        /* 46 is char code for "." */
        for(i=0; i < split_text.length; i++) ret_text=ret_text+String.fromCharCode(46+(parseInt(split_text[i])-dot_char)/2);
        return ret_text.replace(/^mailto:/,"");
    };
    /**
     * parse_appsstaff parses the /apps/staff page for an Educational Networks page
     * needs work,
     * in particular it shouldn't do every request in most cases and in fact it's bad to do so because
     * they catch you for scraping
     */
    Schools.parse_appsstaff=function(doc,url,resolve,reject,extra_arg)
    {
        console.log("arguments="+arguments[4]);
        var i,staff_elem=doc.getElementsByClassName("staff-categoryStaffMember"),promise,person;
        for(i=0; i < staff_elem.length; i++) {
            console.log("staff_elem[i]="+staff_elem[i].innerHTML);
            var the_url=fix_remote_url(staff_elem[i].getElementsByTagName("a")[0].href,url);
            person=Schools.get_appsstaff_nametitle(staff_elem[i]);
            console.log("the_url["+i+"]="+the_url+", person="+JSON.stringify(person));

            if(the_url.indexOf("&pREC_ID=contact")===-1) the_url=the_url+"&pREC_ID=contact";
            promise=MTurkScript.prototype.create_promise(the_url,Schools.parse_appsstaff_contactpage,
                                                         appsstaff_contactpage_then);
            if(i>0) break;

        }
        resolve("Finished appsstaff");
    };
   
    /* Followup function for appsstaff_contactpage_then, doesn't need to be in original that should be an argument */
    function appsstaff_contactpage_then(result) {
        console.log("result for contactpage="+JSON.stringify(result));
    }

    /**
     * parse_appsstaff_contactpage grabs data from a single individual's contact page in
     * create_promise form (incomplete needs work!!!)
     */
    Schools.parse_appsstaff_contactpage=function(doc,url,resolve,reject) {
        var result={name:"",email:"",phone:"",title:""},staffOverview,dl,dt,dd,i,ret;
        var contacts=doc.getElementsByClassName("staffContactWrapper"),phone_match;
        if((staffOverview=doc.getElementsByClassName("staffOverview")).length>0) {
            ret=Schools.get_appsstaff_nametitle(staffOverview[0]);
            result.name=ret.name;
            result.title=ret.title;
        }
        for(i=0; i < contacts.length; i++) if(phone_match=contacts[i].innerText.match(phone_re)) result.phone=phone_match[0];
        if(doc.getElementsByName("e").length>0) result.email=Schools.convert_ednetworks_email(doc.getElementsByName("e")[0].value.replace(/,/g,""));
        resolve(result);
    };
    /* Helper function to get the name and title of a staff member at ednetworks edlio schools on the appsstaff
     * page or the contact page (same format) */
    Schools.get_appsstaff_nametitle=function(div) {
        var dl,dt,dd,result={name:"",title:""};
        if((dl=div.getElementsByTagName("dl")).length>0) {
            if((dt=dl[0].getElementsByTagName("dt")).length>0) result.name=dt[0].innerText.trim();
            if((dd=dl[0].getElementsByTagName("dd")).length>0) result.title=dd[0].innerText.trim();
        }
        return result;
    };

    /**
     * '''try_specific''' searches for a specific type of school directory format
     * that needs extra work to scrape
     * doc is parsed response.responseText from GM_xmlhttprequest
     * finalUrl is response.finalUrl from same query, appendElement is place to append non-scripts (scripts appended to head)
     */
    function try_specific(doc,finalUrl,appendElement) {
        var scripts=doc.scripts,i;
        var bbbutt=doc.getElementsByClassName("bb-butt");
        var staffDirectory=doc.getElementsByClassName("staffDirectoryComponent");
        if(bbbutt.length>0) {
            console.log("Found blackboard");
            do_blackboard(doc,finalUrl,appendElement);
            return true;
        }
        else if(staffDirectory.length>0) {
            console.log("Found react");
            do_react(doc,finalUrl,appendElement);
            return true;
        }
        return false;
    }

    /**
     * '''do_west_react''' does the react-based West Corporation queries
     * doc is the parsed document from the GM_xmlhttprequest response.responseText,
     * finalUrl is response.finalUrl from same query
     */
    Schools.do_west_react=function(doc,url,resolve,reject,extra_arg) {
        var appendElement=extra_arg.append, callback=extra_arg.callback;
        Schools.westSearchTerm=extra_arg.searchTerm;
        url=url.replace(/^(https?:\/\/[^\/]+).*$/,"$1");
        Schools.westBaseUrl=url;
        function increment_scripts() {
            console.log("Loaded "+(++Schools.loadedWestScripts)+" out of "+Schools.totalWestScripts+" total scripts");
            if(Schools.loadedWestScripts===Schools.totalWestScripts) Schools.loadWestSettings(callback);
        }
        console.log("Doing react");
        var scripts=doc.scripts,i,div=document.createElement("div"),script_list=[],curr_script;
        Schools.portletInstanceId=doc.getElementsByClassName("staffDirectoryComponent")[0].dataset.portletInstanceId;
        if(appendElement!==undefined) appendElement.appendChild(doc.getElementsByClassName("staffDirectoryComponent")[0]);
        var good_scripts=doc.querySelectorAll("script[id*='ctl']"), head=document.getElementsByTagName("head")[0];
        Schools.totalWestScripts=good_scripts.length;
        Schools.loadedWestScripts=0;
        for(i=0; i<good_scripts.length; i++) {
            (curr_script=document.createElement("script")).src=good_scripts[i].src;
            curr_script.onload=increment_scripts;
            script_list.push(curr_script);
            head.appendChild(curr_script);
        }
    };
    /* Loads the settings, namely the groupIds which is all we need */
    Schools.loadWestSettings=function(callback) {
        var json={"portletInstanceId":Schools.portletInstanceId};
        Schools.loadWestReact("Settings",json,function(response) {
            var r_json=JSON.parse(response.responseText),i;
            Schools.westGroupIds=[];
            for(i=0; i < r_json.d.groups.length; i++) Schools.westGroupIds.push(r_json.d.groups[i].groupID);
            Schools.loadWestSearch(callback);
        });
    }
    /**
     * '''loadWestSearch''' loads the West Corporation style search query for the job title set by
     * my_query.job_title r loads the first 20 alphabetically otherwise if my_query.job_title isn't set
     *
     * Letting json_response=JSON.parse(response.responseText), json_response.d.results should have a
     * list of objects of the results to the query, with
     * fields email, firstName, lastName,jobTitle,phone,website,imageURL,userID
     *
     *
     */
    Schools.loadWestSearch=function(callback) {
        var json={"firstRecord":0,"groupIds":Schools.westGroupIds,"lastRecord":39,
                 "portletInstanceId":Schools.portletInstanceId,
                 "searchTerm":Schools.westSearchTerm,"sortOrder":"LastName,FirstName ASC","searchByJobTitle":true};
        if(Schools.westSearchTerm===undefined) { json.searchTerm=""; json.searchByJobTitle=false; }
        Schools.loadWestReact("Search",json,callback);
    };
    /**
     * '''loadWestReact''' does a GM_xmlhttprequest query of the StaffDirectory at the my_query.staff_path in question
     *
     * (my_query.staff_path to be found by searching e.g. Bing, and should be the part found by /https?:\/\/[^\/]+/
     * type is the type of query to get ("Settings" or "Search"), url is the what's the fucking word for beginning of path
     * url of the website
     * json is the json to send with it since it's a POST request
     * callback is the callback
     */
    Schools.loadWestReact=function(type,json,callback) {
        var url=Schools.westBaseUrl+"/Common/controls/StaffDirectory/ws/StaffDirectoryWS.asmx/"+type;
        console.log("url="+url);
        var headers={"Content-Type":"application/json;charset=UTF-8"};
        GM_xmlhttpRequest({method: 'POST', url: url, headers:headers, data:JSON.stringify(json),
            onload: function(response) {
                if(type==="Search") { Schools.parseWestSearch(response,callback); }
                else { callback(response); }
            },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });
    };
    /**
     * parse_west_search is called after the initial search query with the response,
     * searches to see if there are any private emails, then grabs them
     * with another loophole
     */
    Schools.parseWestSearch=function(response,callback) {
        var search=JSON.parse(response.responseText);
        var results=search.d.results,i,url;
        Schools.westResults=results;Schools.westPrivateCount=0;Schools.westPrivateDone=0;
        var promise_list=[];
        for(i=0; i < results.length; i++)
        {
            console.log("("+i+"), "+JSON.stringify(results[i]));
            if(results[i].email==="private")
            {
                Schools.westPrivateCount++;
                url=Schools.westBaseUrl+"/common/controls/General/Email/Default.aspx?action=staffDirectoryEmail&"+
                    "recipients="+results[i].userID;
                console.log("private email url="+url);
                promise_list.push(MTurkScript.prototype.create_promise(url,Schools.getWestPrivateEmail,callback,MTurkScript.prototype.my_catch_func,i));
            }
            else
            {
                console.log("results["+i+"].email="+results[i].email);
            }
//            console.log("Email for "+i+"="+results[i].email);
        }
        //console.log("search="+text);
    };
    /**
     * getWestPrivateEmail uses another avenue to find the emails they tried to keep private
     * it resolves on the original callback to the West thing once all the private emails have been grabbed
     * probably a clunky way to do it but it's working and should be self contained
     */
    Schools.getWestPrivateEmail=function(doc,url,resolve,reject,i) {
        console.log("url="+url);
        var headers={"Content-Type":"application/json;charset=UTF-8"};
        Schools.westResults[i].email=doc.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtTo").value;
        Schools.westPrivateDone++;
        console.log("Done "+Schools.westPrivateDone+" private emails");
        if(Schools.westPrivateCount===Schools.westPrivateDone)
        {
            resolve(i);
        }

    };
    /* Starter code for gabbard search */
    Schools.parse_gabbard=function(doc,url,resolve,reject) {

        //https://www.usd377.org/includes/actions/search.php?term=principal&id=357&from=0&to=10
        //https://www.usd257.org/includes/actions/search.php?term=principal&id=538%2C539%2C540%2C541%2C542%2C543%2C537&from=0&to=10
        //<script>window.search_site = '538,539,540,541,542,543,537';</script> (right below the #search_field element on https://www.usd257.org/search_e)
    };
    /**  Schools.init_search Initializes Schools search, a create_promise style function
     * input page should've been identified already as the directory page
     */
    /* Schools.call_parser is a helper function to create a promise for the school parser */
    Schools.call_parser=function(url) {
        var promise=MTP.create_promise(url,Schools.curr_school.parser,Schools.resolve,Schools.reject);
    };
    /** Schools.init_SchoolSearch initializes the School search create_promise thing given we've gotten a url already
     * query: {type: string, name:string,title_regex:[]} will be an object where type is either district or school
     * and TODO: name is a name of school or blank depending on whether we got sent a url or not as initial data
     * for now deal with name as name, title_regex is a list of titles
     */
    Schools.init_SchoolSearch=function(doc,url,resolve,reject,query) {
        var curr_school,promise,parse_url;
        Schools.base=url.replace(/\/$/,"")
        Schools.url=url.replace(/(https?:\/\[^\/]*).*$/,"$1");
        console.log("Schools.init_SchoolSearch, url="+url+", query="+JSON.stringify(query));
        Schools.resolve=resolve;Schools.reject=reject;Schools.type=query.type;Schools.name=query.name;
        Schools.title_regex=query.title_regex;Schools.title_str=query.title_str;
        Schools.page_type=Schools.id_page_type(doc,url,resolve,reject,query);
        Schools.curr_school=Schools[Schools.page_type];
        console.log("page_type="+Schools.page_type);

        /* Base is the base page for a school if we're in a district/system page */
        if((curr_school=Schools[Schools.page_type])&&curr_school.find_base&&Schools.type==="school") {
            console.log("searching for base "+JSON.stringify(Schools[Schools.page_type]));
            Schools.base=curr_school.find_base(doc,url+(curr_school.base_suffix?curr_school.base_suffix:"")).replace(/\/$/,""); }
        console.log("Schools.base="+Schools.base);
        /* if suffix we can immediately head to the directory parser */
        if(curr_school && curr_school.suffix) {
            console.log("# heading immediately to directory");
            Schools.call_parser(Schools.base+curr_school.suffix); }
        else if(curr_school && curr_school.find_directory) {
            console.log("# Finding directory");
            promise=MTP.create_promise(Schools.base,curr_school.find_directory,Schools.call_parser,MTP.my_catch_func,curr_school);
        }
        else if(!curr_school) { console.log("School page_type not defined parsing yet, trying parse_none");



                              }
        else { console.log("Weird shouldn't be here"); }
    };
    /** Schools.init_Schools initializes schools
     query: {type: string, name:string,title_regex:[],title_str:string,url:url,state_dir:boolean,addressLine1,city,state,zip}
     title_regex is a list of regexes for the title, title_str is a string only version
     will be an object where type is either district or school
     name is a name of school or blank, and url is either a url or empty (url and name should never BOTH be empty),
     state_dir is whether to try our luck with the state directory only

     addressLine1,city,state,zip are as usual
     returns a promise (can be "then'd" on the client side)
    */
    Schools.init_Schools=function(query) {
        Schools.type=query.type;Schools.name=query.name;Schools.title_regex=query.title_regex;Schools.state_dir=query.state_dir;
        Schools.addressLine1=query.addressLine1;Schools.city=query.city;Schools.state=query.state;
        const schoolPromise=new Promise((resolve,reject) => {
            if(Schools.state_dir) Schools[Schools.state].get_state_dir(resolve,reject);
        });
        return schoolPromise;
    };
    /* Fix abbreviated or otherwise screwed up school names */
    Schools.fix_school_name=function(name) {
        var rep_begin="(^|[^A-Za-z]{1})",rep_end="($|([^A-Za-z]{1}))",x;
        var replace_map={"Elem":"Elementary","Ctr":"Center","Co":"County","&amp;":"&","Sch(l)?":"School","Int":"Intermediate","Jr(\\.)?":"Junior"};
        for(x in replace_map) name=name.replace(new RegExp(rep_begin+x+rep_end),"$1"+replace_map[x]+"$2");
        return name.replace(/\s*\(.*$/,"").trim();
    };




    /* Probably should change to have a specific function for the script using the School thing */
    Schools.parse_promise_then=function(result) {
        console.log("parse_promise_then: result="+JSON.stringify(Schools.contact_list));
    }
    /* TODO: NEEDS A TON OF WORK VERY ANNOYING WITH XML STUFF */
    Schools.HI.get_state_dir=function(resolve,reject) {
        var url="http://www.hawaiipublicschools.org/ParentsAndStudents/EnrollingInSchool/SchoolFinder/Pages/home.aspx";

       var promise=MTP.create_promise(url,Schools.HI.get_state_dirA,resolve,reject);
    }
    Schools.HI.get_state_dirA=function(doc,url,resolve,reject) {
        var url2="http://www.hawaiipublicschools.org/ParentsAndStudents/EnrollingInSchool/SchoolFinder/Pages/home.aspx?fk="+encodeURIComponent(Schools.name);
        console.log("url="+url);
        var headers={"Host":"www.hawaiipublicschools.org","referer":"http://www.hawaiipublicschools.org/ParentsAndStudents/EnrollingInSchool/SchoolFinder/Pages/home.aspx",
                    "Upgrade-Insecure-Requests":1};
        GM_xmlhttpRequest({method: 'GET', url: url2,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.HI.get_school_search(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
       // var promise=MTP.create_promise(url,Schools.HI.get_school_search,resolve,reject);
    };
    Schools.HI.get_school_search=function(doc,url,resolve,reject) {
        console.log("MOO "+doc.body.innerHTML);
        var result=doc.getElementsByClassName("school-search-result"),i,inner_a;
        for(i=0;i<result.length;i++) {
            if((inner_a=result[i].getElementsByTagName("a")).length>0) { console.log("inner_a[0].innerText="+inner_a[0].innerText+", "+inner_a[0].href); }
        }
    };
    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurkScript!==undefined && Schools!==undefined && School!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    var query_list=[{url:"https://www.bellechasseacademy.org/",query:{type:"school",name:"Berwick High School",title_regex: [/Principal/i],state:"LA"}},
                    {url:"https://www.cpsb.org/",query:{type:"school",name:"High",title_regex: [/Principal/i],state:"LA"}}];
    var query_list2=["https://www.abseconschools.org/"];//https://www.wcpss.net/"];


    function parse_school_then(self) {
        console.log(self.name+": contact_list="+JSON.stringify(self.contact_list)); }


    Schools.load_spreadsheet=function(doc,url,resolve,reject) {
        var split_lines=MTP.csvToArray(doc.body.innerHTML),i,curr_line;
        console.log("split_lines["+0+"]="+split_lines[0]);
        var title_map=Schools.get_spreadsheet_title_map(split_lines[0]),curr_school,temp_contact=null,x;
        console.log("title_map="+JSON.stringify(title_map));
        for(i=1;i<split_lines.length;i++) {
            curr_line=split_lines[i];
           // console.log("curr_line="+JSON.stringify(curr_line));
            curr_school={};
            //    console.log("split_lines["+i+"]="+split_lines[i]);
            for(x in title_map) curr_school[x]=curr_line[title_map[x]].trim();
            if(title_map.first!==undefined&&title_map.last!==undefined) curr_school.name=curr_school.first+" "+curr_school.last;

            if(!curr_school.street&&curr_school.address) curr_school.street=curr_school.address;
            curr_school.school=Schools.fix_school_name(curr_school.school);
              if(/Ankeny Christian  Academy/.test(curr_school.school)) {
                  Schools.school_list.push(curr_school); }
        }
        resolve("");
    };
    function load_spreadsheet_then(response) {
        do_schools(0,50); }
    /* Search for school pages beginning at ''begin'', ending before ''begin+num'', timing out do to more,
    doing at most limit in total */
    function do_schools(begin,num,limit) {
        var i;
        limit=limit&&limit<Schools.school_list.length?limit:Schools.school_list.length;
        var promise_list=[],school_obj_list=[],temp_school;
        if(num+begin<limit) setTimeout(do_schools,2500,begin+num,num,limit);
        for(i=begin;i<Schools.school_list.length&&i<num+begin;i++) {
           temp_school=new School({type:"school",name:Schools.school_list[i].school,street:Schools.school_list[i].street,
                                   city:Schools.school_list[i].city,state:Schools.school_list[i].state,
                                  title_regex: [/Principal/i],title_str:"Principal",debug:true},parse_school_then);

            Schools.school_obj_list.push(temp_school);
        }
    }

    /* TODO: need to ensure Secretary to Principal and such are weeded out in query forms */
    function init_Query()
    {
        var title_list=[/Principal/];
        var page_type_regex=new RegExp(Schools.page_regex_str,"i");
        var query={type:"school",name:"DANIEL BOONE HIGH SCHOOL",title_regex: [/Principal/i],title_str:"Principal",state:"LA"};
        var url="https://www.wcde.org";
//          var promise=Schools.init_Schools(query)
  //     .then(function(response) { console.log("Kabee\n"+JSON.stringify(Schools.contact_list)); });
        Schools.school_list=[];
        Schools.school_obj_list=[];
        Schools.state="IA";
        //console.log("*** email="+Schools.convert_cyberschools_email(encoded_email));
         var sheet_url="https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/CSV/"+Schools.state+".csv";
        var promise=MTP.create_promise(sheet_url,Schools.load_spreadsheet,load_spreadsheet_then);
     //   var NJurl="https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/NJATLMER.csv";
      //  var promise=MTP.create_promise(NJurl,load_schools);

    }
    
    if(window.location.href.indexOf("trystuff.com")!==-1) begin_script();
})();
