(() => {
  "use strict";
  const SUPABASE_URL = "https://zijbjvbnhzcwbsrnwlxm.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1PBzt-cQuyzXRx5ORWL0Dg_MPPcS_bb";
  const LOCAL_KEY = "rx2_recovery";
  const $ = id => document.getElementById(id);
  const status = message => { const el=$("cloudStatus"); if(el) el.textContent=message; };
  if (!window.supabase || !window.supabase.createClient) {
    status("Cloud library did not load. Check your internet connection and reload.");
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
  const nativeSetItem = Storage.prototype.setItem;
  let currentUser = null, syncing = false, queued = false, reloadAfterMerge = false;
  const validStatuses = ["Pending","In Review","Recovered","Permanently Recovered","Closed"];
  const readLocal = () => {
    try { const data=JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]"); return Array.isArray(data)?data:[]; }
    catch (_) { return []; }
  };
  const writeLocal = rows => nativeSetItem.call(localStorage,LOCAL_KEY,JSON.stringify(rows));
  const toCloud = (row,userId) => ({
    user_id:userId, local_id:String(row.id||("RX-"+Date.now())),
    platform:["Facebook","Instagram","Gmail","TikTok","Other"].includes(row.platform)?row.platform:"Other",
    account_label:String(row.name||"Untitled account").slice(0,80),
    status:validStatuses.includes(row.status)?row.status:"Pending",
    notes:String(row.issue||"").slice(0,500)||null,
    followup_date:row.followup||null,
    created_at:row.createdAt||new Date().toISOString(),
    updated_at:row.updatedAt||row.createdAt||new Date().toISOString()
  });
  const fromCloud = row => ({
    id:row.local_id||row.id, name:row.account_label||"Untitled account",
    platform:row.platform||"Other", issue:row.notes||"", followup:row.followup_date||"",
    status:validStatuses.includes(row.status)?row.status:"Pending",
    createdAt:row.created_at||new Date().toISOString(),
    updatedAt:row.updated_at||row.created_at||new Date().toISOString()
  });
  async function pushLocal() {
    if (!currentUser || syncing) return;
    const rows=readLocal();
    if (!rows.length) return;
    const payload=rows.map(row=>toCloud(row,currentUser.id));
    const {error}=await client.from("recovery_records").upsert(payload,{onConflict:"user_id,local_id"});
    if(error) throw error;
  }
  async function fullSync() {
    if (!currentUser || syncing) return;
    syncing=true;
    try {
      status("Syncing your private recovery records…");
      const {data:cloudRows,error}=await client.from("recovery_records")
        .select("id,user_id,local_id,platform,account_label,status,notes,followup_date,created_at,updated_at")
        .eq("user_id",currentUser.id);
      if(error) throw error;
      const local=readLocal(), merged=new Map(local.map(row=>[String(row.id),row]));
      for(const cloudRow of (cloudRows||[])) {
        const remote=fromCloud(cloudRow), key=String(remote.id), existing=merged.get(key);
        if(!existing || (Date.parse(remote.updatedAt)||0)>(Date.parse(existing.updatedAt)||0)) {
          merged.set(key,remote);
        }
      }
      const combined=Array.from(merged.values()).sort((a,b)=>(Date.parse(b.updatedAt)||0)-(Date.parse(a.updatedAt)||0));
      const before=JSON.stringify(local);
      if(before!==JSON.stringify(combined)) { writeLocal(combined); reloadAfterMerge=true; }
      if(combined.length) {
        const {error:upsertError}=await client.from("recovery_records")
          .upsert(combined.map(row=>toCloud(row,currentUser.id)),{onConflict:"user_id,local_id"});
        if(upsertError) throw upsertError;
      }
      status("Cloud sync complete · "+combined.length+" recovery record(s) saved to your account.");
      if(reloadAfterMerge) { reloadAfterMerge=false; setTimeout(()=>window.location.reload(),250); }
    } catch(error) {
      console.error("Cloud sync error",error);
      status("Sync could not finish. Check your connection, then tap Sync now. Your local records remain on this device.");
    } finally { syncing=false; }
  }
  function setSignedIn(user) {
    currentUser=user||null;
    const signed=!!currentUser;
    ["cloudEmail","cloudPassword","cloudSignIn","cloudSignUp"].forEach(id=>{if($(id))$(id).hidden=signed;});
    ["cloudSignOut","cloudSyncNow"].forEach(id=>{if($(id))$(id).hidden=!signed;});
    if(signed) { if($("cloudEmail"))$("cloudEmail").value=currentUser.email||""; status("Signed in as "+(currentUser.email||"your account")+". Preparing cloud sync…"); }
    else status("Not signed in. Create a cloud account or sign in to enable backup.");
  }
  async function withBusy(button,task) {
    if(button)button.disabled=true;
    try { await task(); } catch(error) { status(error?.message||"Unable to complete that action. Please try again."); }
    finally { if(button)button.disabled=false; }
  }
  $("cloudSignUp")?.addEventListener("click",e=>withBusy(e.currentTarget,async()=>{
    const email=$("cloudEmail").value.trim(),password=$("cloudPassword").value;
    if(!email||password.length<8) { status("Enter a valid email and a password with at least 8 characters."); return; }
    const {data,error}=await client.auth.signUp({email,password});
    if(error) throw error;
    if(data.session) { setSignedIn(data.user); await fullSync(); }
    else status("Account created. Check your email for the confirmation link, then return here and sign in.");
  }));
  $("cloudSignIn")?.addEventListener("click",e=>withBusy(e.currentTarget,async()=>{
    const email=$("cloudEmail").value.trim(),password=$("cloudPassword").value;
    if(!email||!password) { status("Enter your cloud email and password."); return; }
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error) throw error;
    setSignedIn(data.user); await fullSync();
  }));
  $("cloudSignOut")?.addEventListener("click",e=>withBusy(e.currentTarget,async()=>{
    const {error}=await client.auth.signOut();
    if(error) throw error;
    setSignedIn(null);
  }));
  $("cloudSyncNow")?.addEventListener("click",()=>fullSync());
  const originalSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value) {
    originalSet.call(this,key,value);
    if(key===LOCAL_KEY && currentUser && !syncing) {
      if(queued)return;
      queued=true;
      setTimeout(async()=>{queued=false;try{await pushLocal();status("Cloud backup updated.");}catch(error){console.error(error);status("Local save succeeded, but cloud backup failed. Tap Sync now to retry.");}},500);
    }
  };
  client.auth.getSession().then(({data,error})=>{
    if(error) { status("Could not check cloud sign-in. Reload and try again."); return; }
    setSignedIn(data.session?.user||null);
    if(data.session?.user) fullSync();
  });
  client.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_OUT") setSignedIn(null);
    else if(session?.user && (!currentUser || currentUser.id!==session.user.id)) {
      setSignedIn(session.user);
      setTimeout(()=>fullSync(),0);
    }
  });
})();