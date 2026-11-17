$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Huihui Desktop')
$synth.Rate = -1
$clips = @{
  hearing = '\u8bf7\u8bb0\u4f4f\u9a8c\u8bc1\u7801\u4e03\u56db\u4e00\u4e5d\uff0c\u5e76\u70b9\u51fb\u4e09\u53f7\u7a97\u53e3\u3002'
  hospital = '\u773c\u775b\u4e0d\u8212\u670d\uff0c\u8bf7\u9009\u62e9\u773c\u775b\u4e0d\u8212\u670d\uff0c\u7136\u540e\u786e\u8ba4\u773c\u79d1\u6302\u53f7\u3002'
  payment = '\u6bcf\u6708\u4e8c\u5341\u4e5d\u5143\uff0c\u5173\u95ed\u81ea\u52a8\u7eed\u8d39\u540e\u4e0d\u518d\u6263\u6b3e\u3002'
  escape = '\u4e09\u53f7\u9600\u95e8\u5f02\u5e38\uff0c\u8bf7\u5148\u5173\u95ed\uff0c\u7136\u540e\u4ece\u5b89\u5168\u51fa\u53e3\u0041\u64a4\u79bb\u3002'
}
try {
  foreach ($entry in $clips.GetEnumerator()) {
    $path = Join-Path $PSScriptRoot ('../public/audio/' + $entry.Key + '.wav')
    $synth.SetOutputToWaveFile([IO.Path]::GetFullPath($path))
    $synth.Speak([regex]::Unescape($entry.Value))
    $synth.SetOutputToNull()
    Write-Output ('Generated ' + $entry.Key + '.wav')
  }
} finally { $synth.Dispose() }
