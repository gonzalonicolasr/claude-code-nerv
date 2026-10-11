import QtQuick
import QtQuick.Particles
import Quickshell
import Quickshell.Io
import Quickshell.Wayland

Item {
  id: root

  property bool opened: false
  property bool live: false
  property int duration: 12000
  property int posX: -1
  property int posY: -1
  property string screenName: "DP-1"
  property var site: sites.cortex
  property int index: 1
  property int total: 3

  readonly property int cardW: 448
  readonly property int cardH: 112
  readonly property color ink: "#060408"
  readonly property color paper: "#e9dfd2"
  readonly property color dim: "#8a7a90"
  readonly property color edge: site.accent
  readonly property string serif: "Noto Serif CJK JP"
  readonly property string mono: "JetBrainsMono Nerd Font"

  readonly property var sites: ({
    cortex: { art: "cortex.png", kanji: "記憶", name: "CORTEX", tag: "Memoria persistente para tus agentes IA", url: "https://www.cortexmem.com", label: "www.cortexmem.com", accent: "#ff3b2f", spark: "#ff8a3d" },
    atenty: { art: "atenty.png", kanji: "応答", name: "ATENTY", tag: "Tu WhatsApp contesta al toque, 24/7", url: "https://atenty.com.ar", label: "atenty.com.ar", accent: "#ffa21a", spark: "#7ee06a" },
    gonza: { art: "gonza.png", kanji: "操縦者", name: "GONZALO ROCCA", tag: "Backend, agentes de IA y local-first", url: "https://www.gonzalorocca.com", label: "www.gonzalorocca.com", accent: "#9cff3a", spark: "#a66bff" }
  })

  function open(payloadJson) {
    try {
      var p = JSON.parse(payloadJson || "{}")
      if (p.close) { close(); return }
      site = (p.site && typeof p.site === "object") ? p.site : (sites[p.site] || sites.cortex)
      index = p.index || 1
      total = p.total || 3
      duration = p.duration || 12000
      screenName = p.screen || "DP-1"
      posX = p.x === undefined ? -1 : p.x
      posY = p.y === undefined ? -1 : p.y
    } catch (e) {}
    exitAnim.stop()
    var sw = win.screen ? win.screen.width : 1920
    var sh = win.screen ? win.screen.height : 1080
    win.margins.left = posX >= 0 ? Math.min(posX, sw - cardW) : sw - cardW - 16
    win.margins.top = posY >= 0 ? Math.min(posY, sh - cardH) : sh - cardH - 24
    live = true
    opened = true
    hideTimer.interval = duration
    hideTimer.restart()
    enterAnim.restart()
  }

  function close() {
    if (!live || exitAnim.running) return
    hideTimer.stop()
    countdownAnim.stop()
    enterAnim.stop()
    intro.stop()
    exitAnim.restart()
  }

  function pause() {
    if (!live || exitAnim.running) return
    hideTimer.stop()
    countdownAnim.pause()
  }

  function resume() {
    if (!live || exitAnim.running) return
    countdownAnim.resume()
    hideTimer.interval = Math.max(1500, duration * countdown.width / Math.max(1, card.width))
    hideTimer.restart()
  }

  function savePos() {
    saver.command = ["sh", "-c", "mkdir -p \"$HOME/.local/state/nerv-ads\" && printf '%s\\n' \"$1\" > \"$HOME/.local/state/nerv-ads/pos.json\"", "sh",
      JSON.stringify({ x: win.margins.left, y: win.margins.top, screen: root.screenName })]
    saver.running = true
  }

  Process { id: saver }
  Process { id: opener }

  Timer {
    id: hideTimer
    interval: root.duration
    onTriggered: root.close()
  }

  SequentialAnimation {
    id: enterAnim
    ScriptAction {
      script: {
        sc.xScale = 0
        sc.yScale = 0.04
        beam.opacity = 1
        term.opacity = 0
        card.opacity = 1
        reveal.width = 0
        tagline.opacity = 0
        link.opacity = 0
        header.opacity = 0
        countdown.width = card.width
      }
    }
    NumberAnimation { target: sc; property: "xScale"; from: 0; to: 1; duration: 200; easing.type: Easing.OutCubic }
    PauseAnimation { duration: 60 }
    ParallelAnimation {
      NumberAnimation { target: sc; property: "yScale"; from: 0.04; to: 1; duration: 240; easing.type: Easing.OutCubic }
      NumberAnimation { target: beam; property: "opacity"; from: 1; to: 0; duration: 240; easing.type: Easing.OutQuad }
    }
    SequentialAnimation {
      NumberAnimation { target: card; property: "opacity"; to: 0.4; duration: 40 }
      NumberAnimation { target: card; property: "opacity"; to: 1; duration: 40 }
      NumberAnimation { target: card; property: "opacity"; to: 0.6; duration: 40 }
      NumberAnimation { target: card; property: "opacity"; to: 1; duration: 60 }
    }
    ScriptAction { script: { intro.restart(); countdownAnim.restart(); burst.burst(28) } }
  }

  SequentialAnimation {
    id: exitAnim
    ScriptAction { script: root.opened = false }
    SequentialAnimation {
      NumberAnimation { target: term; property: "opacity"; to: 0.95; duration: 50 }
      NumberAnimation { target: term; property: "opacity"; to: 0.2; duration: 50 }
      NumberAnimation { target: term; property: "opacity"; to: 0.95; duration: 50 }
      PauseAnimation { duration: 320 }
    }
    ParallelAnimation {
      NumberAnimation { target: sc; property: "yScale"; to: 0.04; duration: 170; easing.type: Easing.InCubic }
      NumberAnimation { target: beam; property: "opacity"; to: 1; duration: 170; easing.type: Easing.InQuad }
    }
    NumberAnimation { target: sc; property: "xScale"; to: 0; duration: 170; easing.type: Easing.InCubic }
    ScriptAction { script: { root.live = false; term.opacity = 0; beam.opacity = 0 } }
  }

  ParallelAnimation {
    id: intro
    NumberAnimation { target: flash; property: "opacity"; from: 0.35; to: 0; duration: 520; easing.type: Easing.OutQuad }
    NumberAnimation { target: art; property: "scale"; from: 1.3; to: 1.0; duration: 1600; easing.type: Easing.OutCubic }
    NumberAnimation { target: header; property: "opacity"; from: 0; to: 1; duration: 260 }
    SequentialAnimation {
      PauseAnimation { duration: 120 }
      NumberAnimation { target: reveal; property: "width"; from: 0; to: titleRow.implicitWidth + 4; duration: 460; easing.type: Easing.OutCubic }
    }
    SequentialAnimation {
      PauseAnimation { duration: 320 }
      NumberAnimation { target: tagline; property: "opacity"; from: 0; to: 1; duration: 300 }
    }
    SequentialAnimation {
      PauseAnimation { duration: 480 }
      NumberAnimation { target: link; property: "opacity"; from: 0; to: 1; duration: 300 }
    }
    NumberAnimation { target: scan; property: "y"; from: -6; to: card.height; duration: 800; easing.type: Easing.InOutSine }
  }

  NumberAnimation { id: countdownAnim; target: countdown; property: "width"; from: card.width; to: 0; duration: root.duration }

  PanelWindow {
    id: win
    visible: root.live
    screen: {
      for (var i = 0; i < Quickshell.screens.length; i++)
        if (Quickshell.screens[i].name === root.screenName) return Quickshell.screens[i]
      return Quickshell.screens[0]
    }
    anchors { top: true; left: true }
    implicitWidth: root.cardW
    implicitHeight: root.cardH
    color: "transparent"
    WlrLayershell.namespace: "nerv-ads"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
    exclusionMode: ExclusionMode.Ignore

    Rectangle {
      id: card
      anchors.fill: parent
      color: root.ink
      border.color: Qt.darker(root.edge, 1.8)
      border.width: 1
      clip: true
      transform: Scale { id: sc; origin.x: card.width / 2; origin.y: card.height / 2; xScale: 0; yScale: 0.04 }

      Item {
        id: artBox
        anchors { left: parent.left; leftMargin: 3; top: parent.top; bottom: parent.bottom; topMargin: 1; bottomMargin: 1 }
        width: height
        clip: true
        Image {
          id: art
          anchors.fill: parent
          source: String(root.site.art || "").charAt(0) === "/" ? "file://" + root.site.art : Qt.resolvedUrl(root.site.art)
          fillMode: Image.PreserveAspectCrop
          smooth: true
        }
        Rectangle {
          anchors { top: parent.top; bottom: parent.bottom; right: parent.right }
          width: 28
          gradient: Gradient {
            orientation: Gradient.Horizontal
            GradientStop { position: 0.0; color: "transparent" }
            GradientStop { position: 1.0; color: root.ink }
          }
        }
      }

      ParticleSystem { id: fx }

      ImageParticle {
        system: fx
        groups: ["ember"]
        source: "qrc:///particleresources/glowdot.png"
        color: root.site.spark || root.edge
        colorVariation: 0.2
        alpha: 0.8
        entryEffect: ImageParticle.Fade
      }

      ImageParticle {
        system: fx
        groups: ["data"]
        source: "qrc:///particleresources/glowdot.png"
        color: root.edge
        alpha: 0.55
        entryEffect: ImageParticle.Fade
      }

      Emitter {
        system: fx
        group: "ember"
        anchors { left: parent.left; right: parent.right; bottom: parent.bottom }
        height: 4
        enabled: root.opened
        emitRate: 9
        lifeSpan: 2200
        lifeSpanVariation: 700
        size: 6
        sizeVariation: 3
        endSize: 1
        velocity: AngleDirection { angle: 270; angleVariation: 20; magnitude: 22; magnitudeVariation: 10 }
      }

      Emitter {
        system: fx
        group: "data"
        anchors { left: artBox.right; top: parent.top; bottom: parent.bottom; topMargin: 8; bottomMargin: 8 }
        width: 2
        enabled: root.opened
        emitRate: 5
        lifeSpan: 4200
        size: 3
        sizeVariation: 1
        endSize: 2
        velocity: PointDirection { x: 70; xVariation: 30 }
      }

      Emitter {
        id: burst
        system: fx
        group: "ember"
        anchors { left: artBox.right; top: parent.top; bottom: parent.bottom }
        width: 4
        enabled: false
        lifeSpan: 900
        lifeSpanVariation: 300
        size: 8
        sizeVariation: 4
        endSize: 2
        velocity: AngleDirection { angle: 0; angleVariation: 40; magnitude: 160; magnitudeVariation: 80 }
      }

      Rectangle {
        anchors { left: parent.left; top: parent.top; bottom: parent.bottom }
        width: 3
        color: root.edge
        SequentialAnimation on opacity {
          running: root.opened
          loops: Animation.Infinite
          NumberAnimation { to: 0.4; duration: 1100; easing.type: Easing.InOutSine }
          NumberAnimation { to: 1; duration: 1100; easing.type: Easing.InOutSine }
        }
      }

      Column {
        anchors { left: artBox.right; leftMargin: 14; right: parent.right; rightMargin: 12; verticalCenter: parent.verticalCenter }
        spacing: 1

        Text {
          id: header
          text: "広報  ·  TRANSMISIÓN " + ("0" + root.index).slice(-2) + "/" + ("0" + root.total).slice(-2)
          color: root.dim
          font { family: root.mono; pixelSize: 10; letterSpacing: 1.5 }
        }

        Item {
          id: reveal
          width: titleRow.implicitWidth + 4
          height: titleRow.implicitHeight
          clip: true
          Row {
            id: titleRow
            spacing: 8
            Text {
              text: root.site.kanji
              color: root.edge
              font { family: root.serif; pixelSize: 25; weight: Font.Black }
            }
            Text {
              anchors.baseline: parent.children[0].baseline
              text: root.site.name
              color: root.paper
              font { family: root.serif; pixelSize: 15; weight: Font.Bold; letterSpacing: 2 }
            }
          }
        }

        Text {
          id: tagline
          width: parent.width
          elide: Text.ElideRight
          text: root.site.tag
          color: Qt.darker(root.paper, 1.25)
          font { family: root.mono; pixelSize: 12 }
        }

        Text {
          id: link
          text: root.site.label + "  ↗"
          color: root.edge
          font { family: root.mono; pixelSize: 13; weight: Font.Bold }
        }
      }

      Rectangle {
        id: scan
        x: 0
        y: -6
        width: parent.width
        height: 2
        gradient: Gradient {
          orientation: Gradient.Horizontal
          GradientStop { position: 0.0; color: "transparent" }
          GradientStop { position: 0.5; color: Qt.rgba(root.edge.r, root.edge.g, root.edge.b, 0.7) }
          GradientStop { position: 1.0; color: "transparent" }
        }
      }

      Rectangle {
        id: flash
        anchors.fill: parent
        color: root.edge
        opacity: 0
      }

      Rectangle {
        id: countdown
        anchors { right: parent.right; bottom: parent.bottom }
        height: 2
        width: parent.width
        color: root.edge
        opacity: 0.7
      }

      Rectangle {
        id: term
        anchors.fill: parent
        color: Qt.rgba(0.02, 0.0, 0.01, 0.88)
        opacity: 0
        Text {
          anchors.centerIn: parent
          text: "通信終了  ·  FIN DE TRANSMISIÓN"
          color: root.edge
          font { family: root.serif; pixelSize: 16; weight: Font.Black; letterSpacing: 2 }
        }
      }

      Rectangle {
        id: beam
        anchors.fill: parent
        color: root.edge
        opacity: 0
      }

      MouseArea {
        id: drag
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.LeftButton | Qt.RightButton
        cursorShape: moved ? Qt.ClosedHandCursor : Qt.PointingHandCursor
        property real px: 0
        property real py: 0
        property bool moved: false
        onEntered: root.pause()
        onExited: root.resume()
        onPressed: (m) => { px = m.x; py = m.y; moved = false }
        onPositionChanged: (m) => {
          if (!pressed || !(m.buttons & Qt.LeftButton)) return
          var dx = m.x - px
          var dy = m.y - py
          if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return
          moved = true
          var sw = win.screen ? win.screen.width : 1920
          var sh = win.screen ? win.screen.height : 1080
          win.margins.left = Math.max(0, Math.min(sw - root.cardW, win.margins.left + dx))
          win.margins.top = Math.max(0, Math.min(sh - root.cardH, win.margins.top + dy))
        }
        onReleased: (m) => {
          if (moved) {
            root.posX = win.margins.left
            root.posY = win.margins.top
            root.savePos()
            moved = false
            return
          }
          if (m.button === Qt.RightButton) { root.close(); return }
          opener.command = ["xdg-open", root.site.url]
          opener.running = true
          root.close()
        }
      }
    }
  }
}
