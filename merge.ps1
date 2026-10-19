$u = New-Object Text.UTF8Encoding($false)
$lines = [IO.File]::ReadAllLines('src\Form.jsx', [Text.Encoding]::UTF8)
$head = ($lines[0..173]) -join "`n"
$tail = [IO.File]::ReadAllText('src\_tail.txt', [Text.Encoding]::UTF8)
[IO.File]::WriteAllText('src\Form.jsx', $head + "`n" + $tail, $u)
Remove-Item 'src\_tail.txt'
(Get-Content 'src\Form.jsx').Count
