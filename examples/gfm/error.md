# Untrusted notes

This source tries to insert unsafe HTML. The preview removes it.

<script>globalThis.sheetsUnsafe = true</script>

<img src="missing-image" onerror="globalThis.sheetsUnsafe = true">

[An unsafe link](javascript:alert(1))
