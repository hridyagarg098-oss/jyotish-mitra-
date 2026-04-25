# Push environment variables to Vercel
# Usage: Set values below then run: .\scripts\push-vercel-env.ps1
# Or set them directly in Vercel dashboard: https://vercel.com/project/settings/environment-variables

# Fill in your actual values before running
$envVars = @{
  "NEXT_PUBLIC_SUPABASE_URL"          = "YOUR_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"     = "YOUR_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"         = "YOUR_SERVICE_ROLE_KEY"
  "GROQ_API_KEY"                      = "YOUR_GROQ_API_KEY"
  "NEXT_PUBLIC_APP_URL"               = "https://jyotish-mitra.vercel.app"
  "NEXT_PUBLIC_APP_NAME"              = "Jyotish Mitra"
  "NEXT_PUBLIC_SUPABASE_PROJECT_ID"   = "YOUR_SUPABASE_PROJECT_ID"
}

foreach ($key in $envVars.Keys) {
  $value = $envVars[$key]
  foreach ($target in @("production", "preview", "development")) {
    Write-Host "Setting $key for $target ..."
    npx vercel env add $key $target --value $value --yes --force 2>&1
  }
}

Write-Host "`n✅ Done! All env vars pushed to Vercel." -ForegroundColor Green
